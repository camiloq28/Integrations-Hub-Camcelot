
// /server/integrations/gmail/actions.js

module.exports = [
  {
    key: 'send_email',
    label: 'Send Email',
    description: 'Sends an email via Gmail',
    fields: [
      { name: 'to', label: 'To Email', type: 'email', required: true },
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      { name: 'body', label: 'Email Body', type: 'textarea', required: true }
    ]
  },
  {
    key: 'forward_email',
    label: 'Forward Email',
    description: 'Forwards an email to another recipient',
    fields: [
      { name: 'to', label: 'Forward To', type: 'email', required: true },
      { name: 'message', label: 'Additional Message', type: 'textarea', required: false }
    ]
  }
];
