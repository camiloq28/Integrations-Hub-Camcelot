// /server/integrations/metadata/gmail.js

module.exports = {
  actions: [
    {
      key: 'send_email',
      label: 'Send Email',
      fields: [
        { name: 'to', label: 'Recipient Email' },
        { name: 'subject', label: 'Subject' },
        { name: 'body', label: 'Email Body' }
      ]
    }
  ],
  triggers: [
    {
      key: 'new_email_received',
      label: 'New Email Received'
    }
  ]
};
