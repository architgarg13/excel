const SHEET_TYPES = {
  payCurves: {
    label: 'Pay Curves',
    expectedHeaders: [
      'Achievement',
      'Calculated pay-out'
    ]
  },
  planMaster: {
    label: 'Plan Master',
    expectedHeaders: [
      'Country Code', 'TeamId', 'TeamName', 'BUId', 'BUDescription',
      'Level Name', 'Brand', 'Channel', 'Data Type', 'Component Name',
      'Component Weight', 'Level of Metric Measurement', 'Plan Type',
      'Plan Period', 'Performance Calculation Frequency', 'Payout Frequency',
      'Annual Target Pay', 'Attainment_Rounding Value',
      'PercentagePayout_Rounding Value', 'Payout_Rounding Value',
      'Payout Curve', 'Draw Multiplier'
    ]
  },
  processedSales: {
    label: 'Processed Sales',
    expectedHeaders: [
      'CountryCode', 'TeamId', 'BUId', 'LevelName', 'Workunit',
      'Brand', 'SalesType', 'Measure',
      'Month1', 'Month2', 'Month3', 'Month4', 'Month5', 'Month6',
      'Month7', 'Month8', 'Month9', 'Month10', 'Month11', 'Month12',
      'Period Sales'
    ]
  },
  processedGoals: {
    label: 'Processed Goals',
    expectedHeaders: [
      'CountryCode', 'TeamId', 'BUId', 'LevelName', 'Brand',
      'Workunit', 'DataPeriod', 'Goals',
      'Month1', 'Month2', 'Month3', 'Month4', 'Month5', 'Month6',
      'Month7', 'Month8', 'Month9', 'Month10', 'Month11', 'Month12',
      'Period Goals'
    ]
  },
  terrHierarchy: {
    label: 'Territory Hierarchy',
    expectedHeaders: [
      'Country Code', 'WorkUnitId', 'WorkUnitName', 'WorkUnitParentId',
      'LevelName', 'RoleName', 'TeamId', 'PositionId',
      'EffectiveStartDate', 'EffectiveEndDate'
    ]
  },
  employeeAssignment: {
    label: 'Employee Assignment',
    expectedHeaders: [
      'CountryCode', 'EmployeeId', 'Employee Name', 'WorkUnitId',
      'Effort', 'PrimaryAssignment', 'EmployeeRole',
      'EffectiveStartDate', 'EffectiveEndDate'
    ]
  },
  employee: {
    label: 'Employee',
    expectedHeaders: [
      'CountryCode', 'EmployeeId', 'EmployeeName', 'FirstName',
      'LastName', 'MiddleName', 'PreferredName', 'Title',
      'EmployeeStatus', 'EmployeeType', 'HireDate', 'TermDate',
      'ManagerId', 'ManagerName', 'Email', 'Department',
      'CostCenter', 'Location', 'Currency'
    ]
  },
  eligibility: {
    label: 'Eligibility',
    expectedHeaders: [
      'CountryCode', 'TeamId', 'BUId', 'Level', 'Role',
      'EmployeeId', 'WorkUnitId', 'Assignment Start Date',
      'Assignment End Date', 'Protection Eligibility',
      'Non Protection Eligibility', 'EmployeName'
    ]
  },
  mboInput: {
    label: 'MBO Input',
    expectedHeaders: [
      'CountryCode', 'BUId', 'TeamId', 'RoleId', 'Employee Id',
      'WorkUnitId', 'PlanPeriodId', 'MBOId', 'MBODescription',
      'MBOScale', 'MBOTarget', 'MBOActuals', 'MBOweight', 'MBOScore'
    ]
  }
};

const SHEET_ORDER = [
  'payCurves', 'planMaster', 'processedSales', 'processedGoals',
  'terrHierarchy', 'employeeAssignment', 'employee', 'eligibility', 'mboInput'
];

// Aliases for worksheet name matching (checked in SHEET_ORDER so employeeAssignment before employee)
const SHEET_NAME_ALIASES = {
  payCurves: ['pay curves', 'paycurves', 'pay curve', 'payout curves'],
  planMaster: ['plan master', 'planmaster', 'plan_master'],
  processedSales: ['processed sales', 'processedsales', 'processed_sales', 'sales'],
  processedGoals: ['processed goals', 'processedgoals', 'processed_goals', 'goals'],
  terrHierarchy: ['territory hierarchy', 'terrhierarchy', 'terr hierarchy', 'terr_hierarchy', 'territory_hierarchy'],
  employeeAssignment: ['employee assignment', 'employeeassignment', 'emp assignment', 'employee_assignment'],
  employee: ['employee', 'employees', 'emp'],
  eligibility: ['eligibility', 'eligible'],
  mboInput: ['mbo input', 'mboinput', 'mbo_input', 'mbo']
};

/**
 * Match a worksheet name to a sheet type by checking keys, labels, and aliases.
 * Returns sheetType string or null.
 */
function matchWorksheetToSheetType(name) {
  const normalized = name.toLowerCase().trim();
  // Check in SHEET_ORDER to ensure employeeAssignment is checked before employee
  for (const type of SHEET_ORDER) {
    // Check exact key match
    if (normalized === type.toLowerCase()) return type;
    // Check label match
    if (normalized === SHEET_TYPES[type].label.toLowerCase()) return type;
    // Check aliases
    const aliases = SHEET_NAME_ALIASES[type] || [];
    if (aliases.some(a => normalized === a)) return type;
  }
  return null;
}

/**
 * Score each unmatched type by header overlap with worksheet headers.
 * Returns best match if >= 50% of expected headers match.
 */
function matchByHeaders(worksheetHeaders, unmatchedTypes) {
  const normalizedWsHeaders = worksheetHeaders.map(h => h.toLowerCase().trim());
  let bestType = null;
  let bestScore = 0;

  for (const type of unmatchedTypes) {
    const expected = SHEET_TYPES[type].expectedHeaders;
    const matchCount = expected.filter(eh =>
      normalizedWsHeaders.includes(eh.toLowerCase().trim())
    ).length;
    const score = matchCount / expected.length;
    if (score >= 0.5 && score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

module.exports = { SHEET_TYPES, SHEET_ORDER, SHEET_NAME_ALIASES, matchWorksheetToSheetType, matchByHeaders };
