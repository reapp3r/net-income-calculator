const path = require('path');
const { loadData } = require('../../lib/loader');

function getTestReferenceData() {
  const dataDir = path.join(__dirname, '../../data/PT');
  return loadData(dataDir);
}

module.exports = {
  getTestReferenceData
};
