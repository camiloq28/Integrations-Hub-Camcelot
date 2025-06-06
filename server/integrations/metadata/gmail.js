
module.exports = {
  triggers: [
    {
      key: 'new_email_received',
      label: 'New Email Received',
      description: 'Triggers when a new email is received'
    },
    {
      key: 'email_replied',
      label: 'Email Replied',
      description: 'Triggers when an email is replied to'
    }
  ],
  actions: [
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
  ]
};
