/**
 * Smart Header Matching Engine
 *
 * Three strategies applied in order of confidence:
 * 1. Normalized Match — strip separators, compare lowercase
 * 2. Regex Pattern Match — common abbreviation patterns
 * 3. Dice Coefficient Similarity — bigram overlap (>= 0.75 threshold)
 */

// --- Strategy 1: Normalized Match ---

function normalize(str) {
  return str.replace(/[\s_\-]+/g, '').toLowerCase();
}

// --- Strategy 2: Regex Pattern Map ---

// expectedHeader → array of regex alternatives
const REGEX_PATTERNS = {
  // Cross-sheet patterns
  'CountryCode':              [/^country[\s_-]*code$/i],
  'Country Code':             [/^country[\s_-]*code$/i],
  'EmployeeId':               [/^emp(loyee)?[\s_-]*(id|code|number|#|no)$/i],
  'Employee Id':              [/^emp(loyee)?[\s_-]*(id|code|number|#|no)$/i],
  'EmployeeName':             [/^emp(loyee)?[\s_-]*name$/i],
  'Employee Name':            [/^emp(loyee)?[\s_-]*name$/i],
  'EmployeName':              [/^emp(loyee?)?[\s_-]*name$/i],
  'WorkUnitId':               [/^work[\s_-]*unit[\s_-]*(id|code)$/i],
  'TeamId':                   [/^team[\s_-]*(id|code)$/i],
  'BUId':                     [/^bu[\s_-]*(id|code)$/i],
  'EffectiveStartDate':       [/^eff(ective)?[\s_-]*start[\s_-]*(date|dt)?$/i],
  'EffectiveEndDate':         [/^eff(ective)?[\s_-]*end[\s_-]*(date|dt)?$/i],
  'CostCenter':               [/^cost[\s_-]*cent(er|re)[\s_-]*(code)?$/i],
  'LevelName':                [/^level[\s_-]*name$/i],
  'Level Name':               [/^level[\s_-]*name$/i],

  // Pay Curves
  'Calculated pay-out':       [/^calc(ulated)?[\s_-]*pay[\s_-]*(out|ment)$/i],

  // Plan Master
  'Annual Target Pay':        [/^annual[\s_-]*target[\s_-]*pay$/i],
  'Draw Multiplier':          [/^draw[\s_-]*mult(iplier)?$/i],
  'Component Weight':         [/^comp(onent)?[\s_-]*w(eigh)?t$/i],
  'Component Name':           [/^comp(onent)?[\s_-]*name$/i],
  'Payout Curve':             [/^pay[\s_-]*(out)?[\s_-]*curve$/i],
  'Plan Type':                [/^plan[\s_-]*type$/i],
  'Plan Period':              [/^plan[\s_-]*period$/i],
  'Data Type':                [/^data[\s_-]*type$/i],

  // Processed Sales / Goals
  'Period Sales':             [/^period[\s_-]*sales$/i],
  'Period Goals':             [/^period[\s_-]*goals$/i],
  'SalesType':                [/^sales[\s_-]*type$/i],

  // Employee
  'FTE Indicator':            [/^fte[\s_-]*(indicator|flag|ind)?$/i],
  'PayrollID':                [/^payroll[\s_-]*(id|code|number)$/i],
  'HeadCountFunction':        [/^head[\s_-]*count[\s_-]*(function|func)?$/i],
  'CostCenterDescription':    [/^cost[\s_-]*cent(er|re)[\s_-]*desc(ription)?$/i],
  'CompanyCode':              [/^company[\s_-]*(code|id)$/i],
  'EmployeeLogin':            [/^emp(loyee)?[\s_-]*login$/i],
  'EmployeeEmail':            [/^emp(loyee)?[\s_-]*e?mail$/i],
  'EmployeeTitle':            [/^emp(loyee)?[\s_-]*title$/i],
  'EmployeeCategory':         [/^emp(loyee)?[\s_-]*cat(egory)?$/i],
  'EmployeeType':             [/^emp(loyee)?[\s_-]*type$/i],
  'EmployeeStatus':           [/^emp(loyee)?[\s_-]*status$/i],
  'EmployeeRole':             [/^emp(loyee)?[\s_-]*role$/i],
  'JobCode':                  [/^job[\s_-]*(code|id)$/i],

  // Employee Assignment
  'PrimaryAssignment':        [/^primary[\s_-]*assign(ment)?$/i],

  // Eligibility
  'Protection Eligibility':       [/^prot(ection)?[\s_-]*elig(ibility)?$/i],
  'Non Protection Eligibility':   [/^non[\s_-]*prot(ection)?[\s_-]*elig(ibility)?$/i],
  'Assignment Start Date':        [/^assign(ment)?[\s_-]*start[\s_-]*(date|dt)?$/i],
  'Assignment End Date':          [/^assign(ment)?[\s_-]*end[\s_-]*(date|dt)?$/i],

  // Territory Hierarchy
  'WorkUnitName':             [/^work[\s_-]*unit[\s_-]*name$/i],
  'WorkUnitParentId':         [/^work[\s_-]*unit[\s_-]*parent[\s_-]*(id|code)$/i],
  'RoleName':                 [/^role[\s_-]*name$/i],
  'PositionId':               [/^position[\s_-]*(id|code)$/i],

  // MBO Input
  'PlanPeriodId':             [/^plan[\s_-]*period[\s_-]*(id|code)$/i],
  'MBOId':                    [/^mbo[\s_-]*(id|code)$/i],
  'MBODescription':           [/^mbo[\s_-]*desc(ription)?$/i],
  'MBOScale':                 [/^mbo[\s_-]*scale$/i],
  'MBOTarget':                [/^mbo[\s_-]*target$/i],
  'MBOActuals':               [/^mbo[\s_-]*actuals?$/i],
  'MBOweight':                [/^mbo[\s_-]*w(eigh)?t$/i],
  'MBOScore':                 [/^mbo[\s_-]*score$/i],
  'RoleId':                   [/^role[\s_-]*(id|code)$/i],

  // Plan Master additional
  'TeamName':                 [/^team[\s_-]*name$/i],
  'BUDescription':            [/^bu[\s_-]*desc(ription)?$/i],
  'Level of Metric Measurement': [/^level[\s_-]*(of[\s_-]*)?metric[\s_-]*meas(urement)?$/i],
  'Performance Calculation Frequency': [/^perf(ormance)?[\s_-]*calc(ulation)?[\s_-]*freq(uency)?$/i],
  'Payout Frequency':         [/^pay[\s_-]*(out)?[\s_-]*freq(uency)?$/i],
  'Attainment_Rounding Value': [/^attain(ment)?[\s_-]*round(ing)?[\s_-]*val(ue)?$/i],
  'PercentagePayout_Rounding Value': [/^percent(age)?[\s_-]*pay[\s_-]*(out)?[\s_-]*round(ing)?[\s_-]*val(ue)?$/i],
  'Payout_Rounding Value':    [/^pay[\s_-]*(out)?[\s_-]*round(ing)?[\s_-]*val(ue)?$/i],
};

function regexMatch(expectedHeader, uploadedHeader) {
  const patterns = REGEX_PATTERNS[expectedHeader];
  if (!patterns) return false;
  const trimmed = uploadedHeader.trim();
  return patterns.some(rx => rx.test(trimmed));
}

// --- Strategy 3: Dice Coefficient Similarity ---

function bigrams(str) {
  const s = normalize(str);
  const result = [];
  for (let i = 0; i < s.length - 1; i++) {
    result.push(s.slice(i, i + 2));
  }
  return result;
}

function diceCoefficient(a, b) {
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0;

  const setB = new Map();
  for (const bg of bigramsB) {
    setB.set(bg, (setB.get(bg) || 0) + 1);
  }

  let intersect = 0;
  for (const bg of bigramsA) {
    const count = setB.get(bg) || 0;
    if (count > 0) {
      intersect++;
      setB.set(bg, count - 1);
    }
  }

  return (2 * intersect) / (bigramsA.length + bigramsB.length);
}

const SIMILARITY_THRESHOLD = 0.75;
const MIN_LENGTH_FOR_SIMILARITY = 4;

// --- Exported Functions ---

/**
 * Returns the best matching uploaded header for an expected header, or null.
 * Applies strategies in priority order: normalized → regex → similarity.
 */
function smartMatch(expectedHeader, uploadedHeaders) {
  const normExpected = normalize(expectedHeader);

  // Strategy 1: Normalized match
  for (const uh of uploadedHeaders) {
    if (normalize(uh) === normExpected) {
      return uh;
    }
  }

  // Strategy 2: Regex match
  for (const uh of uploadedHeaders) {
    if (regexMatch(expectedHeader, uh)) {
      return uh;
    }
  }

  // Strategy 3: Dice similarity
  if (normExpected.length >= MIN_LENGTH_FOR_SIMILARITY) {
    let bestHeader = null;
    let bestScore = 0;
    for (const uh of uploadedHeaders) {
      if (normalize(uh).length < MIN_LENGTH_FOR_SIMILARITY) continue;
      const score = diceCoefficient(expectedHeader, uh);
      if (score >= SIMILARITY_THRESHOLD && score > bestScore) {
        bestScore = score;
        bestHeader = uh;
      }
    }
    if (bestHeader) return bestHeader;
  }

  return null;
}

/**
 * Returns { mapping, matched, needsMapping } using smart matching.
 * Each uploaded header can only be claimed once.
 */
function smartAutoMatch(uploadedHeaders, expectedHeaders) {
  const mapping = {};
  const matched = [];
  const needsMapping = [];
  const claimed = new Set();

  for (const expected of expectedHeaders) {
    const available = uploadedHeaders.filter(h => !claimed.has(h));
    const match = smartMatch(expected, available);
    if (match) {
      mapping[expected] = match;
      matched.push(expected);
      claimed.add(match);
    } else {
      needsMapping.push(expected);
    }
  }

  return { mapping, matched, needsMapping };
}

/**
 * Checks if a cell value looks like a known header.
 * Used by findHeaderRow for smart header row detection.
 */
function isKnownHeader(cellValue, allExpectedHeaders) {
  if (cellValue == null) return false;
  const str = String(cellValue).trim();
  if (str === '') return false;

  const normCell = normalize(str);

  // Check normalized match against any known header
  for (const eh of allExpectedHeaders) {
    if (normalize(eh) === normCell) return true;
  }

  // Check regex patterns
  for (const [, patterns] of Object.entries(REGEX_PATTERNS)) {
    if (patterns.some(rx => rx.test(str))) return true;
  }

  return false;
}

/**
 * Normalized header inclusion check for matchByHeaders.
 * Returns true if the expected header has a match in the worksheet headers.
 */
function normalizedIncludes(normalizedWsHeaders, expectedHeader) {
  const normExpected = normalize(expectedHeader);

  // Strategy 1: Normalized match
  if (normalizedWsHeaders.some(nh => normalize(nh) === normExpected)) {
    return true;
  }

  // Strategy 2: Regex match
  for (const nh of normalizedWsHeaders) {
    if (regexMatch(expectedHeader, nh)) {
      return true;
    }
  }

  return false;
}

module.exports = { smartMatch, smartAutoMatch, isKnownHeader, normalizedIncludes };
