const path = require('path');
const { loadReferenceData } = require('../../lib/loader');

function getTestReferenceData() {
  const dataDir = path.join(__dirname, '../../data/references/portugal');
  return loadReferenceData(dataDir);
}

module.exports = {
  getTestReferenceData
};
