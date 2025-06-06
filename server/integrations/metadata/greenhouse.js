
module.exports = {
  triggers: [
    {
      key: 'new_candidate',
      label: 'New Candidate Added',
      description: 'Triggers when a new candidate is created in Greenhouse'
    },
    {
      key: 'stage_change',
      label: 'Candidate Stage Changed',
      description: 'Triggers when a candidate moves to a different stage'
    },
    {
      key: 'job_posted',
      label: 'Job Posted',
      description: 'Triggers when a new job is posted'
    }
  ],
  actions: [
    {
      key: 'create_candidate',
      label: 'Create Candidate',
      description: 'Creates a new candidate in Greenhouse',
      fields: [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: false }
      ]
    },
    {
      key: 'send_email',
      label: 'Send Email',
      description: 'Sends an email through Greenhouse',
      fields: [
        { name: 'to', label: 'To Email', type: 'email', required: true },
        { name: 'subject', label: 'Subject', type: 'text', required: true },
        { name: 'body', label: 'Email Body', type: 'textarea', required: true }
      ]
    }
  ]
};
