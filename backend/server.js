
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/cmdb_monitor');

const Metric = mongoose.model('Metric', new mongoose.Schema({
  from: String,
  to: String,
  latency: Number,
  status: String,
  timestamp: { type: Date, default: Date.now }
}));

app.post('/api/metrics', async (req, res) => {
  const metric = new Metric(req.body);
  await metric.save();
  res.send({ success: true });
});

app.get('/api/metrics', async (req, res) => {
  const since = new Date(Date.now() - 60000); // últimos 60 segundos
  const data = await Metric.find({ timestamp: { $gte: since } });
  res.json(data);
});

app.listen(3001, () => console.log('Monitor API running on http://localhost:3001'));
