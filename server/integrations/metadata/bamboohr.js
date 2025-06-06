
module.exports = {
  triggers: [
    {
      key: 'new_employee',
      label: 'New Employee Added',
      description: 'Triggers when a new employee is added to BambooHR'
    },
    {
      key: 'employee_updated',
      label: 'Employee Updated',
      description: 'Triggers when employee information is updated'
    }
  ],
  actions: [
    {
      key: 'create_employee',
      label: 'Create Employee',
      description: 'Creates a new employee in BambooHR',
      fields: [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Work Email', type: 'email', required: true },
        { name: 'department', label: 'Department', type: 'text', required: false }
      ]
    },
    {
      key: 'update_employee',
      label: 'Update Employee',
      description: 'Updates employee information in BambooHR',
      fields: [
        { name: 'employee_id', label: 'Employee ID', type: 'text', required: true },
        { name: 'field_name', label: 'Field to Update', type: 'text', required: true },
        { name: 'field_value', label: 'New Value', type: 'text', required: true }
      ]
    }
  ]
};
