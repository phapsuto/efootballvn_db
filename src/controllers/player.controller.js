const { listPlayers, getPlayerById } = require('../services/player.service');

const getPlayers = async (req, res) => {
  const result = await listPlayers(req.query);
  res.json(result);
};

const getPlayerDetail = async (req, res) => {
  const player = await getPlayerById(req.params.id);

  if (!player) {
    return res.status(404).json({
      message: 'Không tìm thấy cầu thủ.'
    });
  }

  return res.json({ data: player });
};

module.exports = {
  getPlayers,
  getPlayerDetail
};
