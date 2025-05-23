module.exports = {
  triggers: [
    { key: 'greenhouse.new_candidate', label: 'New Candidate Created' },
    { key: 'greenhouse.stage_change', label: 'Candidate Stage Changed' },
    { key: 'greenhouse.job_posted', label: 'Job Posted' }
  ],
  actions: [
    { key: 'slack.send_message', label: 'Send Slack Message' },
    { key: 'email.notify_hiring_team', label: 'Email Hiring Team' }
  ]
};
