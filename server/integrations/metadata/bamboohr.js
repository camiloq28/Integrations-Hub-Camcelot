// /server/integrations/metadata/bamboohr.js

module.exports = {
  actions: [
    {
      key: 'create_employee',
      label: 'Create Employee',
      fields: [
        { name: 'first_name', label: 'First Name' },
        { name: 'last_name', label: 'Last Name' },
        { name: 'job_title', label: 'Job Title' },
        { name: 'department', label: 'Department' },
        { name: 'email', label: 'Email Address' }
      ]
    },
    {
      key: 'update_employee',
      label: 'Update Employee',
      fields: [
        { name: 'employee_id', label: 'Employee ID' },
        { name: 'status', label: 'New Status' }
      ]
    }
  ],
  triggers: [
    {
      key: 'new_employee',
      label: 'New Employee Created'
    },
    {
      key: 'employee_status_change',
      label: 'Employee Status Changed'
    }
  ]
};
