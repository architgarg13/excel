/**
 * IC Output - HUB Calculator
 *
 * Computes Incentive Compensation payout calculations for pharma sales teams.
 * Takes 9 input sheets (with raw PayCurves data) and produces IC Output - HUB rows.
 */

const VALID_PLAN_TYPES = ['Goal Attainment', 'MBO', 'Average of Underlying Terrs'];

const OUTPUT_HEADERS = [
  'CountryCode', 'TeamId', 'BUId', 'Level', 'Role',
  'ProductId', 'ChannelId', 'DataType', 'PlanType',
  'EmployeeId', 'WorkUnitId', 'DataPeriod', 'LevelOfMeasurement',
  'Sales', 'Goals', 'Attainment',
  'Draw Multiplier', 'Percent To Target', 'Component Weight', 'Target Pay',
  'New Hire Eligibilty', 'Performance Eligibility', 'IC Eligibility',
  'Pre Eligibilty Earnings', 'Previous Cycle Payout', 'Payout',
  'Key for ZFIR'
];

/**
 * Parse 4 pay curve types from the raw PayCurves sheet data.
 * Columns layout: Narrow(0,1), Mid(3,4), Wide(6,7), Boolean(9,10).
 */
function buildPayCurvesLookup(payCurvesRaw) {
  const curveConfigs = [
    { name: 'Narrow', achCol: 0, payCol: 1 },
    { name: 'Mid', achCol: 3, payCol: 4 },
    { name: 'Wide', achCol: 6, payCol: 7 },
    { name: 'Boolean', achCol: 9, payCol: 10 }
  ];

  const curves = {};
  for (const cfg of curveConfigs) {
    const points = [];
    for (const row of payCurvesRaw) {
      if (!Array.isArray(row)) continue;
      const ach = parseFloat(row[cfg.achCol]);
      const pay = parseFloat(row[cfg.payCol]);
      if (!isNaN(ach) && !isNaN(pay)) {
        points.push({ achievement: ach, payout: pay });
      }
    }
    points.sort((a, b) => a.achievement - b.achievement);
    curves[cfg.name] = points;
  }
  return curves;
}

/**
 * Look up percent-to-target from pay curve points using linear interpolation.
 */
function lookupPercentToTarget(curvePoints, attainment) {
  if (!curvePoints || !curvePoints.length) return 0;
  if (attainment <= curvePoints[0].achievement) return curvePoints[0].payout;
  if (attainment >= curvePoints[curvePoints.length - 1].achievement) return curvePoints[curvePoints.length - 1].payout;

  for (let i = 0; i < curvePoints.length - 1; i++) {
    if (attainment >= curvePoints[i].achievement && attainment <= curvePoints[i + 1].achievement) {
      const range = curvePoints[i + 1].achievement - curvePoints[i].achievement;
      if (range === 0) return curvePoints[i].payout;
      const ratio = (attainment - curvePoints[i].achievement) / range;
      return curvePoints[i].payout + ratio * (curvePoints[i + 1].payout - curvePoints[i].payout);
    }
  }
  return 0;
}

/**
 * Build a lookup key for matching records across sheets.
 */
function makeKey(...parts) {
  return parts.map((p) => String(p || '').trim().toLowerCase()).join('|');
}

/**
 * Round a value to specified decimal places.
 */
function roundTo(value, decimals) {
  if (typeof value !== 'number' || isNaN(value) || decimals == null) return value;
  const d = parseInt(decimals);
  if (isNaN(d)) return value;
  const factor = Math.pow(10, d);
  return Math.round(value * factor) / factor;
}

/**
 * Get trimmed string value from a row object.
 */
function str(row, field) {
  const val = row[field];
  return val != null ? String(val).trim() : '';
}

/**
 * Walk up the territory hierarchy to find the WorkUnitId at a given level.
 * Returns the original wuId if its level already matches.
 */
function findWUAtLevel(wuId, targetLevel, terrMap) {
  if (!targetLevel) return wuId;
  const targetLower = targetLevel.toLowerCase();

  // Check if current WU is already at the target level
  const terr = terrMap[wuId];
  if (terr && terr.levelName.toLowerCase() === targetLower) return wuId;

  // Walk up the parent chain
  let current = wuId;
  const visited = new Set();
  while (current && !visited.has(current)) {
    visited.add(current);
    const t = terrMap[current];
    if (!t) break;
    if (t.levelName.toLowerCase() === targetLower) return current;
    current = t.parentId;
  }
  return wuId; // fallback to original
}

/**
 * Main IC calculation function.
 */
function calculateIC(sheetData) {
  const {
    payCurvesRaw = [],
    planMaster: planMasterData = [],
    processedSales: salesData = [],
    processedGoals: goalsData = [],
    terrHierarchy: terrData = [],
    employeeAssignment: empAssignData = [],
    eligibility: eligibilityData = [],
    mboInput: mboData = []
  } = sheetData;

  // Build pay curves lookup (4 separate curve types)
  const curves = buildPayCurvesLookup(payCurvesRaw);

  // Build territory lookup: WorkUnitId -> territory info
  const terrMap = {};
  const childTerrMap = {}; // parentId -> [childWorkUnitIds]
  for (const row of terrData) {
    const wuId = str(row, 'WorkUnitId');
    if (!wuId) continue;
    terrMap[wuId] = {
      workUnitName: str(row, 'WorkUnitName'),
      parentId: str(row, 'WorkUnitParentId'),
      levelName: str(row, 'LevelName'),
      roleName: str(row, 'RoleName'),
      teamId: str(row, 'TeamId'),
      countryCode: str(row, 'Country Code')
    };

    const parentId = str(row, 'WorkUnitParentId');
    if (parentId) {
      if (!childTerrMap[parentId]) childTerrMap[parentId] = [];
      childTerrMap[parentId].push(wuId);
    }
  }

  // Build WorkUnit -> [EmployeeId] mapping from employee assignments
  const wuToEmployees = {};
  for (const row of empAssignData) {
    const empId = str(row, 'EmployeeId');
    const wuId = str(row, 'WorkUnitId');
    if (!empId || !wuId) continue;
    if (!wuToEmployees[wuId]) wuToEmployees[wuId] = [];
    if (!wuToEmployees[wuId].includes(empId)) {
      wuToEmployees[wuId].push(empId);
    }
  }

  // Build sales lookup: key(teamId, buId, workunit, brand) -> Period Sales value
  const salesMap = {};
  for (const row of salesData) {
    const key = makeKey(row['TeamId'], row['BUId'], row['Workunit'], row['Brand']);
    const val = parseFloat(row['Period Sales']);
    if (!isNaN(val)) salesMap[key] = val;
  }

  // Build goals lookup: key(teamId, buId, workunit, brand) -> Period Goals value
  const goalsMap = {};
  for (const row of goalsData) {
    const key = makeKey(row['TeamId'], row['BUId'], row['Workunit'], row['Brand']);
    const val = parseFloat(row['Period Goals']);
    if (!isNaN(val)) goalsMap[key] = val;
  }

  // Build eligibility lookups: separate NH and Performance
  const eligNHMap = {};  // key(empId, wuId) -> Protection Eligibility (New Hire)
  const eligPerfMap = {}; // key(empId, wuId) -> Non Protection Eligibility (Performance)
  for (const row of eligibilityData) {
    const empId = str(row, 'EmployeeId');
    const wuId = str(row, 'WorkUnitId');
    if (!empId || !wuId) continue;
    const key = makeKey(empId, wuId);
    const protection = parseFloat(row['Protection Eligibility']);
    const nonProtection = parseFloat(row['Non Protection Eligibility']);
    eligNHMap[key] = !isNaN(protection) ? protection : 0;
    eligPerfMap[key] = !isNaN(nonProtection) ? nonProtection : 1;
  }

  // Build MBO lookup: key(employeeId, workUnitId) -> MBOScore
  const mboMap = {};
  for (const row of mboData) {
    const empId = str(row, 'Employee Id');
    const wuId = str(row, 'WorkUnitId');
    const score = parseFloat(row['MBOScore']);
    if (empId && wuId && !isNaN(score)) {
      mboMap[makeKey(empId, wuId)] = score;
    }
  }

  // Filter Plan Master to valid plan types only
  const validPlans = planMasterData.filter((p) => {
    const pt = str(p, 'Plan Type');
    return VALID_PLAN_TYPES.includes(pt);
  });

  const nonManagerPlans = validPlans.filter((p) => str(p, 'Plan Type') !== 'Average of Underlying Terrs');
  const managerPlans = validPlans.filter((p) => str(p, 'Plan Type') === 'Average of Underlying Terrs');

  const outputRows = [];

  // Phase 1: Process non-manager Plan Master rows (Goal Attainment, MBO)
  for (const plan of nonManagerPlans) {
    const teamId = str(plan, 'TeamId');
    const buId = str(plan, 'BUId');
    const levelName = str(plan, 'Level Name');
    const brand = str(plan, 'Brand');
    const channel = str(plan, 'Channel');
    const dataType = str(plan, 'Data Type');
    const planType = str(plan, 'Plan Type');
    const planPeriod = str(plan, 'Plan Period');
    const payoutCurve = str(plan, 'Payout Curve');
    const componentWeight = parseFloat(plan['Component Weight']) || 0;
    const lom = str(plan, 'Level of Metric Measurement');
    const atp = parseFloat(plan['Annual Target Pay']) || 0;
    const dm = parseFloat(plan['Draw Multiplier']) || 0;
    const attRounding = plan['Attainment_Rounding Value'];
    const pctRounding = plan['PercentagePayout_Rounding Value'];
    const payRounding = plan['Payout_Rounding Value'];
    const countryCode = str(plan, 'Country Code');

    // Target Pay = ATP * DM * CW, rounded to payRounding dp
    const targetPay = roundTo(atp * dm * componentWeight, payRounding);

    const isGA = planType === 'Goal Attainment';
    const isMBO = planType === 'MBO';

    // Find territories matching this team + level
    const matchingTerrs = Object.entries(terrMap).filter(([, t]) =>
      t.teamId.toLowerCase() === teamId.toLowerCase() &&
      t.levelName.toLowerCase() === levelName.toLowerCase()
    );

    for (const [wuId, terr] of matchingTerrs) {
      const employees = wuToEmployees[wuId] || [];

      for (const empId of employees) {
        let sales = '';
        let goals = '';
        let attainment = '';
        let percentToTarget = '';
        let preEligEarnings = 0;

        if (isGA) {
          // Find the WU at the LOM level for sales/goals lookup
          const salesWU = findWUAtLevel(wuId, lom, terrMap);
          const salesKey = makeKey(teamId, buId, salesWU, brand);
          const rawSales = salesMap[salesKey];
          const rawGoals = goalsMap[salesKey];

          sales = rawSales != null ? rawSales : '';
          goals = rawGoals != null ? rawGoals : '';

          if (typeof sales === 'number' && typeof goals === 'number' && goals !== 0) {
            attainment = roundTo(sales / goals, attRounding);
          } else {
            attainment = '';
          }

          // Look up percent-to-target from the appropriate pay curve
          const curvePoints = curves[payoutCurve];
          if (typeof attainment === 'number' && curvePoints && curvePoints.length) {
            percentToTarget = roundTo(lookupPercentToTarget(curvePoints, attainment), pctRounding);
            preEligEarnings = targetPay * percentToTarget;
          }
        } else if (isMBO) {
          const mboKey = makeKey(empId, wuId);
          const mboScore = mboMap[mboKey];
          attainment = mboScore != null ? mboScore : '';

          // Look up from pay curve if a matching curve type exists
          const curvePoints = curves[payoutCurve];
          if (curvePoints && curvePoints.length && typeof attainment === 'number') {
            percentToTarget = roundTo(lookupPercentToTarget(curvePoints, attainment), pctRounding);
            preEligEarnings = targetPay * percentToTarget;
          } else if (typeof attainment === 'number') {
            // No curve (e.g. Scorecard) - use attainment directly
            percentToTarget = '';
            preEligEarnings = targetPay * attainment;
          }
        }

        // Eligibility
        const eligKey = makeKey(empId, wuId);
        const nhElig = eligNHMap[eligKey] != null ? eligNHMap[eligKey] : 0;
        const perfElig = eligPerfMap[eligKey] != null ? eligPerfMap[eligKey] : 1;
        const icElig = perfElig;

        // Payout
        const payout = preEligEarnings * icElig;

        // Key for ZFIR
        const salesStr = (sales !== '' && sales != null) ? String(sales) : '';
        const attStr = (attainment !== '' && attainment != null) ? String(attainment) : '';
        const keyForZFIR = salesStr + lom + planType + planPeriod + attStr;

        outputRows.push([
          countryCode, teamId, buId, terr.levelName, terr.roleName,
          brand, channel, dataType, planType,
          empId, wuId, planPeriod, lom,
          sales, goals, attainment,
          dm, percentToTarget, componentWeight, targetPay,
          nhElig, perfElig, icElig,
          preEligEarnings, null, payout,
          keyForZFIR
        ]);
      }
    }
  }

  // Phase 2: Process manager rows ("Average of Underlying Terrs")
  for (const plan of managerPlans) {
    const teamId = str(plan, 'TeamId');
    const buId = str(plan, 'BUId');
    const levelName = str(plan, 'Level Name');
    const brand = str(plan, 'Brand');
    const channel = str(plan, 'Channel');
    const dataType = str(plan, 'Data Type');
    const planType = str(plan, 'Plan Type');
    const planPeriod = str(plan, 'Plan Period');
    const componentWeight = parseFloat(plan['Component Weight']) || 0;
    const lom = str(plan, 'Level of Metric Measurement');
    const atp = parseFloat(plan['Annual Target Pay']) || 0;
    const dm = parseFloat(plan['Draw Multiplier']) || 0;
    const payRounding = plan['Payout_Rounding Value'];
    const countryCode = str(plan, 'Country Code');

    const targetPay = roundTo(atp * dm * componentWeight, payRounding);

    // Find territories at this level for this team
    const matchingTerrs = Object.entries(terrMap).filter(([, t]) =>
      t.teamId.toLowerCase() === teamId.toLowerCase() &&
      t.levelName.toLowerCase() === levelName.toLowerCase()
    );

    for (const [mgrWuId, mgrTerr] of matchingTerrs) {
      const childWuIds = childTerrMap[mgrWuId] || [];
      if (childWuIds.length === 0) continue;

      // Sum PreEligEarnings per child territory, then average
      const childTerrTotals = [];
      for (const childWuId of childWuIds) {
        // Find all output rows for this child territory (all plan types for same team)
        const childRows = outputRows.filter((row) =>
          row[10] === childWuId && // WorkUnitId (index 10)
          row[1] === teamId       // same team
        );
        const totalPreElig = childRows.reduce((sum, row) => {
          const pe = row[23]; // Pre Eligibilty Earnings (index 23)
          return sum + (typeof pe === 'number' ? pe : 0);
        }, 0);
        childTerrTotals.push(totalPreElig);
      }

      const avgPreElig = childTerrTotals.length > 0
        ? childTerrTotals.reduce((a, b) => a + b, 0) / childTerrTotals.length
        : 0;
      const mgrPreElig = avgPreElig * 1.5;

      // Find employees assigned to this manager territory
      const employees = wuToEmployees[mgrWuId] || [];

      for (const empId of employees) {
        const eligKey = makeKey(empId, mgrWuId);
        const nhElig = eligNHMap[eligKey] != null ? eligNHMap[eligKey] : 0;
        const perfElig = eligPerfMap[eligKey] != null ? eligPerfMap[eligKey] : 1;
        const icElig = perfElig;
        const payout = mgrPreElig * icElig;

        // Key for ZFIR: no sales/attainment for manager rows
        const keyForZFIR = lom + planType + planPeriod;

        outputRows.push([
          countryCode, teamId, buId, mgrTerr.levelName, mgrTerr.roleName,
          brand, channel, dataType, planType,
          empId, mgrWuId, planPeriod, lom,
          '', '', '',
          dm, '', componentWeight, targetPay,
          nhElig, perfElig, icElig,
          mgrPreElig, null, payout,
          keyForZFIR
        ]);
      }
    }
  }

  return { headers: OUTPUT_HEADERS, rows: outputRows };
}

module.exports = { calculateIC };
