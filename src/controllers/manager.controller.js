const { listManagers } = require('../services/manager.service');

const getManagers = async (req, res) => {
  const result = await listManagers(req.query);
  res.json(result);
};

module.exports = {
  getManagers
};
