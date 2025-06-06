
// /server/integrations/greenhouse/actions.js

module.exports = [
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
];
