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

module.exports = { SHEET_TYPES, SHEET_ORDER };
