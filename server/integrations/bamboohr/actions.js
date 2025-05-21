// /server/integrations/bamboohr/actions.js

module.exports = [
  {
    key: 'create_employee',
    label: 'Create Employee',
    description: 'Creates a new employee in BambooHR',
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'jobTitle', label: 'Job Title', type: 'text', required: false },
      { name: 'department', label: 'Department', type: 'text', required: false }
    ]
  },
  {
    key: 'update_employee',
    label: 'Update Employee',
    description: 'Updates an existing employee record in BambooHR',
    fields: [
      { name: 'employeeId', label: 'Employee ID', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text', required: false },
      { name: 'jobTitle', label: 'Job Title', type: 'text', required: false },
      { name: 'status', label: 'Employment Status', type: 'text', required: false }
    ]
  }
];
