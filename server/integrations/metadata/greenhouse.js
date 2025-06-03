// server/integrations/metadata/greenhouse.js

module.exports = {
  actions: [
    {
      key: 'create_candidate',
      label: 'Create Candidate',
      fields: [
        { name: 'first_name', label: 'First Name' },
        { name: 'last_name', label: 'Last Name' },
        { name: 'email', label: 'Email' }
      ]
    },
    {
      key: 'update_candidate',
      label: 'Update Candidate',
      fields: [
        { name: 'candidate_id', label: 'Candidate ID' },
        { name: 'status', label: 'New Status' }
      ]
    }
  ],
  triggers: [
    {
      key: 'new_candidate',
      label: 'New Candidate Added'
    },
    {
      key: 'candidate_stage_change',
      label: 'Candidate Stage Changed'
    }
  ]
};
