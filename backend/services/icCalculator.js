/**
 * IC Output - HUB Calculator
 *
 * Computes Incentive Compensation payout calculations for pharma sales teams.
 * Takes 9 input sheets and produces the IC Output - HUB rows.
 */

const OUTPUT_HEADERS = [
  'CountryCode', 'TeamId', 'TeamName', 'BUId', 'BUDescription',
  'LevelName', 'EmployeeId', 'EmployeeName', 'WorkUnitId', 'WorkUnitName',
  'Brand', 'ComponentName', 'ComponentWeight', 'PlanType', 'PlanPeriod',
  'PayoutCurve', 'AnnualTargetPay', 'DrawMultiplier', 'TargetPay',
  'Sales', 'Goals', 'Attainment', 'PercentToTarget',
  'PreEligibilityEarnings', 'ICEligibility', 'Payout'
];

/**
 * Parse pay curves data into a lookup structure.
 * The pay curves sheet has Achievement and Calculated pay-out columns,
 * possibly grouped by curve type (Narrow/Mid/Wide/Boolean).
 */
function buildPayCurvesLookup(payCurvesData) {
  const curves = [];
  for (const row of payCurvesData) {
    const achievement = parseFloat(row['Achievement']);
    const payout = parseFloat(row['Calculated pay-out']);
    if (!isNaN(achievement) && !isNaN(payout)) {
      curves.push({ achievement, payout });
    }
  }
  // Sort by achievement ascending for interpolation
  curves.sort((a, b) => a.achievement - b.achievement);
  return curves;
}

/**
 * Look up percent-to-target from pay curves using linear interpolation.
 */
function lookupPercentToTarget(curves, attainment) {
  if (!curves.length) return 0;
  if (attainment <= curves[0].achievement) return curves[0].payout;
  if (attainment >= curves[curves.length - 1].achievement) return curves[curves.length - 1].payout;

  for (let i = 0; i < curves.length - 1; i++) {
    if (attainment >= curves[i].achievement && attainment <= curves[i + 1].achievement) {
      const range = curves[i + 1].achievement - curves[i].achievement;
      if (range === 0) return curves[i].payout;
      const ratio = (attainment - curves[i].achievement) / range;
      return curves[i].payout + ratio * (curves[i + 1].payout - curves[i].payout);
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
  if (isNaN(value) || decimals == null) return value;
  const d = parseInt(decimals);
  if (isNaN(d)) return value;
  const factor = Math.pow(10, d);
  return Math.round(value * factor) / factor;
}

/**
 * Main IC calculation function.
 */
function calculateIC(sheetData) {
  const {
    payCurves: payCurvesData,
    planMaster: planMasterData,
    processedSales: salesData,
    processedGoals: goalsData,
    terrHierarchy: terrData,
    employeeAssignment: empAssignData,
    employee: employeeData,
    eligibility: eligibilityData,
    mboInput: mboData
  } = sheetData;

  // Build pay curves lookup
  const payCurves = buildPayCurvesLookup(payCurvesData);

  // Build territory lookup: WorkUnitId -> territory info
  const terrMap = {};
  const childTerrMap = {}; // parentId -> [childWorkUnitIds]
  for (const row of terrData) {
    const wuId = String(row['WorkUnitId'] || '').trim();
    terrMap[wuId] = {
      workUnitName: row['WorkUnitName'] || '',
      parentId: String(row['WorkUnitParentId'] || '').trim(),
      levelName: String(row['LevelName'] || '').trim(),
      roleName: String(row['RoleName'] || '').trim(),
      teamId: String(row['TeamId'] || '').trim(),
      countryCode: String(row['Country Code'] || '').trim()
    };

    const parentId = String(row['WorkUnitParentId'] || '').trim();
    if (parentId) {
      if (!childTerrMap[parentId]) childTerrMap[parentId] = [];
      childTerrMap[parentId].push(wuId);
    }
  }

  // Build employee lookup: EmployeeId -> employee info
  const empMap = {};
  for (const row of employeeData) {
    const empId = String(row['EmployeeId'] || '').trim();
    empMap[empId] = {
      employeeName: row['EmployeeName'] || '',
      countryCode: String(row['CountryCode'] || '').trim()
    };
  }

  // Build employee assignment lookup: EmployeeId -> [assignments]
  const empAssignMap = {};
  for (const row of empAssignData) {
    const empId = String(row['EmployeeId'] || '').trim();
    if (!empAssignMap[empId]) empAssignMap[empId] = [];
    empAssignMap[empId].push({
      workUnitId: String(row['WorkUnitId'] || '').trim(),
      effort: parseFloat(row['Effort']) || 1,
      role: String(row['EmployeeRole'] || '').trim()
    });
  }

  // Build sales lookup: key(teamId, buId, workunit, brand) -> Period Sales
  const salesMap = {};
  for (const row of salesData) {
    const key = makeKey(row['TeamId'], row['BUId'], row['Workunit'], row['Brand']);
    salesMap[key] = parseFloat(row['Period Sales']) || 0;
  }

  // Build goals lookup: key(teamId, buId, workunit, brand) -> Period Goals
  const goalsMap = {};
  for (const row of goalsData) {
    const key = makeKey(row['TeamId'], row['BUId'], row['Workunit'], row['Brand']);
    goalsMap[key] = parseFloat(row['Period Goals']) || 0;
  }

  // Build eligibility lookup: key(employeeId, workUnitId) -> eligibility factor
  const eligMap = {};
  for (const row of eligibilityData) {
    const empId = String(row['EmployeeId'] || '').trim();
    const wuId = String(row['WorkUnitId'] || '').trim();
    const protection = parseFloat(row['Protection Eligibility']);
    const nonProtection = parseFloat(row['Non Protection Eligibility']);
    // Use non-protection eligibility as the IC eligibility factor
    const elig = !isNaN(nonProtection) ? nonProtection : (!isNaN(protection) ? protection : 1);
    eligMap[makeKey(empId, wuId)] = elig;
  }

  // Build MBO lookup: key(employeeId, workUnitId) -> MBOScore
  const mboMap = {};
  for (const row of mboData) {
    const empId = String(row['Employee Id'] || '').trim();
    const wuId = String(row['WorkUnitId'] || '').trim();
    const score = parseFloat(row['MBOScore']);
    if (!isNaN(score)) {
      mboMap[makeKey(empId, wuId)] = score;
    }
  }

  const outputRows = [];

  // For each plan master row, generate output rows for matching employees
  for (const plan of planMasterData) {
    const teamId = String(plan['TeamId'] || '').trim();
    const buId = String(plan['BUId'] || '').trim();
    const teamName = String(plan['TeamName'] || '').trim();
    const buDesc = String(plan['BUDescription'] || '').trim();
    const levelName = String(plan['Level Name'] || '').trim();
    const brand = String(plan['Brand'] || '').trim();
    const componentName = String(plan['Component Name'] || '').trim();
    const componentWeight = parseFloat(plan['Component Weight']) || 0;
    const planType = String(plan['Plan Type'] || '').trim();
    const planPeriod = String(plan['Plan Period'] || '').trim();
    const payoutCurve = String(plan['Payout Curve'] || '').trim();
    const annualTargetPay = parseFloat(plan['Annual Target Pay']) || 0;
    const drawMultiplier = parseFloat(plan['Draw Multiplier']) || 1;
    const attainmentRounding = plan['Attainment_Rounding Value'];
    const pctPayoutRounding = plan['PercentagePayout_Rounding Value'];
    const payoutRounding = plan['Payout_Rounding Value'];
    const countryCode = String(plan['Country Code'] || '').trim();

    // Find territories matching this team + level
    const matchingTerrs = Object.entries(terrMap).filter(([, t]) =>
      t.teamId.toLowerCase() === teamId.toLowerCase() &&
      t.levelName.toLowerCase() === levelName.toLowerCase()
    );

    // Find employees assigned to matching territories
    for (const [wuId, terr] of matchingTerrs) {
      // Find employees assigned to this work unit
      const assignedEmployees = Object.entries(empAssignMap).filter(([, assignments]) =>
        assignments.some((a) => a.workUnitId === wuId)
      );

      for (const [empId, assignments] of assignedEmployees) {
        const assignment = assignments.find((a) => a.workUnitId === wuId);
        const emp = empMap[empId] || { employeeName: '', countryCode: '' };

        // Calculate TargetPay
        const targetPay = annualTargetPay * drawMultiplier * componentWeight;

        // Look up Sales and Goals
        const salesKey = makeKey(teamId, buId, wuId, brand);
        const sales = salesMap[salesKey] || 0;
        const goals = goalsMap[salesKey] || 0;

        // Calculate Attainment
        let attainment = 0;
        const isMBO = planType.toLowerCase().includes('mbo');
        if (isMBO) {
          attainment = mboMap[makeKey(empId, wuId)] || 0;
        } else {
          attainment = goals !== 0 ? sales / goals : 0;
        }
        attainment = roundTo(attainment, attainmentRounding);

        // Look up PercentToTarget from pay curves
        let percentToTarget = lookupPercentToTarget(payCurves, attainment);
        percentToTarget = roundTo(percentToTarget, pctPayoutRounding);

        // Calculate PreEligibilityEarnings
        const preEligEarnings = targetPay * percentToTarget;

        // Look up IC Eligibility
        const icEligibility = eligMap[makeKey(empId, wuId)] != null
          ? eligMap[makeKey(empId, wuId)]
          : 1;

        // Calculate Payout
        let payout = preEligEarnings * icEligibility;
        payout = roundTo(payout, payoutRounding);

        outputRows.push([
          countryCode, teamId, teamName, buId, buDesc,
          levelName, empId, emp.employeeName, wuId, terr.workUnitName,
          brand, componentName, componentWeight, planType, planPeriod,
          payoutCurve, annualTargetPay, drawMultiplier, roundTo(targetPay, 2),
          sales, goals, attainment, percentToTarget,
          roundTo(preEligEarnings, 2), icEligibility, payout
        ]);
      }
    }
  }

  // Manager calculation: average of underlying territory pre-eligibility earnings
  // Find manager-level territories (those that have children)
  for (const plan of planMasterData) {
    const teamId = String(plan['TeamId'] || '').trim();
    const levelName = String(plan['Level Name'] || '').trim();

    // Skip if this is a rep-level plan (only process manager levels)
    if (!levelName.toLowerCase().includes('manager') && !levelName.toLowerCase().includes('mgr')) {
      continue;
    }

    const managerTerrs = Object.entries(terrMap).filter(([, t]) =>
      t.teamId.toLowerCase() === teamId.toLowerCase() &&
      t.levelName.toLowerCase() === levelName.toLowerCase()
    );

    for (const [mgrWuId] of managerTerrs) {
      const childWuIds = childTerrMap[mgrWuId] || [];
      if (childWuIds.length === 0) continue;

      // Find existing output rows for child territories
      const childRows = outputRows.filter((row) =>
        childWuIds.includes(row[8]) && // WorkUnitId column
        row[10] === String(plan['Brand'] || '').trim() && // Brand
        row[11] === String(plan['Component Name'] || '').trim() // ComponentName
      );

      if (childRows.length === 0) continue;

      // Average pre-eligibility earnings of children
      const avgPreElig = childRows.reduce((sum, r) => sum + (r[23] || 0), 0) / childRows.length;

      // Find manager employees assigned to this territory
      const mgrAssigned = Object.entries(empAssignMap).filter(([, assignments]) =>
        assignments.some((a) => a.workUnitId === mgrWuId)
      );

      for (const [empId] of mgrAssigned) {
        const emp = empMap[empId] || { employeeName: '' };
        const terr = terrMap[mgrWuId] || {};
        const mgrPreElig = avgPreElig * 1.5;
        const icEligibility = eligMap[makeKey(empId, mgrWuId)] != null
          ? eligMap[makeKey(empId, mgrWuId)]
          : 1;
        const payout = roundTo(mgrPreElig * icEligibility, 2);

        outputRows.push([
          String(plan['Country Code'] || '').trim(),
          teamId,
          String(plan['TeamName'] || '').trim(),
          String(plan['BUId'] || '').trim(),
          String(plan['BUDescription'] || '').trim(),
          levelName,
          empId,
          emp.employeeName,
          mgrWuId,
          terr.workUnitName || '',
          String(plan['Brand'] || '').trim(),
          String(plan['Component Name'] || '').trim(),
          parseFloat(plan['Component Weight']) || 0,
          String(plan['Plan Type'] || '').trim(),
          String(plan['Plan Period'] || '').trim(),
          String(plan['Payout Curve'] || '').trim(),
          parseFloat(plan['Annual Target Pay']) || 0,
          parseFloat(plan['Draw Multiplier']) || 1,
          0, // TargetPay (manager calc override)
          0, // Sales
          0, // Goals
          0, // Attainment
          0, // PercentToTarget
          roundTo(mgrPreElig, 2),
          icEligibility,
          payout
        ]);
      }
    }
  }

  return { headers: OUTPUT_HEADERS, rows: outputRows };
}

module.exports = { calculateIC };
