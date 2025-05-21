// /server/utils/loadActions.js

const fs = require('fs');
const path = require('path');

function loadActions() {
  const integrationsDir = path.join(__dirname, '../integrations');
  const dirs = fs.readdirSync(integrationsDir);
  const result = {};

  dirs.forEach((dir) => {
    const indexPath = path.join(integrationsDir, dir, 'index.js');
    if (fs.existsSync(indexPath)) {
      result[dir] = require(indexPath);
    }
  });

  return result;
}

module.exports = loadActions;
