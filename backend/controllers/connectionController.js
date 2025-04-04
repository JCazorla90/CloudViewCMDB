
const Connection = require('../models/connectionModel');

exports.getAllConnections = async (req, res) => {
  try {
    const connections = await Connection.find({});
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: 'Error cargando conexiones' });
  }
};
