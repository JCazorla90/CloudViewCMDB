const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const queryRouter = require('./ai/query');
app.use(queryRouter);

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/cmdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// --- MODELOS ---
const connectionSchema = new mongoose.Schema({
  provider: String,
  accessMode: String,
  credentials: Object
});
const Connection = mongoose.model('Connection', connectionSchema);

const resourceSchema = new mongoose.Schema({
  externalId: String,
  type: String,
  provider: String,
  name: String,
  region: String,
  metadata: Object,
  updatedAt: { type: Date, default: Date.now }
});
const Resource = mongoose.model('Resource', resourceSchema);

const changeSchema = new mongoose.Schema({
  resourceId: String,
  type: String,
  changes: Object,
  timestamp: { type: Date, default: Date.now }
});
const ChangeLog = mongoose.model('ChangeLog', changeSchema);

// --- COMPLIANCE CHECKER ---
const rules = JSON.parse(fs.readFileSync('./complianceRules.json'));
function getField(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}
app.post('/api/compliance/check', async (req, res) => {
  const resources = req.body;
  const results = resources.map(resource => {
    const failures = [];
    for (const rule of rules) {
      if (rule.type && rule.type !== resource.type) continue;
      if (rule.provider && rule.provider !== resource.provider) continue;
      const val = getField(resource, rule.field);
      if (rule.shouldBe !== undefined && val !== rule.shouldBe) {
        failures.push(rule.label);
      }
      if (rule.notEqual !== undefined && val === rule.notEqual) {
        failures.push(rule.label);
      }
    }
    return {
      id: resource._id || resource.id,
      compliance: failures.length === 0,
      issues: failures
    };
  });
  res.json(results);
});

// --- API DE CONEXIONES ---
app.get('/api/connections', async (req, res) => {
  const conns = await Connection.find();
  res.json(conns);
});

app.post('/api/connections', async (req, res) => {
  const conn = new Connection(req.body);
  await conn.save();
  res.json({ success: true });
});

app.delete('/api/connections/:id', async (req, res) => {
  await Connection.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- SYNC RESOURCES ---
app.post('/api/syncResources', async (req, res) => {
  const newResources = req.body;

  for (const newRes of newResources) {
    const existing = await Resource.findOne({ externalId: newRes.externalId });
    if (!existing) {
      await Resource.create(newRes);
      await ChangeLog.create({ resourceId: newRes.externalId, type: 'create', changes: newRes });
    } else {
      const diffs = {};
      for (const key of Object.keys(newRes)) {
        if (key !== '_id' && JSON.stringify(newRes[key]) !== JSON.stringify(existing[key])) {
          diffs[key] = [existing[key], newRes[key]];
        }
      }
      if (Object.keys(diffs).length > 0) {
        await Resource.updateOne({ _id: existing._id }, newRes);
        await ChangeLog.create({ resourceId: newRes.externalId, type: 'update', changes: diffs });
      }
    }
  }

  const existingIds = (await Resource.find()).map(r => r.externalId);
  const newIds = newResources.map(r => r.externalId);
  const deleted = existingIds.filter(id => !newIds.includes(id));
  for (const id of deleted) {
    await Resource.deleteOne({ externalId: id });
    await ChangeLog.create({ resourceId: id, type: 'delete', changes: {} });
  }

  res.send({ success: true });
});

// --- DISCOVER ALL CON REQUIRE DINÁMICO ---
app.post('/api/discover/all', async (req, res) => {
  const connections = await Connection.find();
  const grouped = {};

  for (const conn of connections) {
    if (!grouped[conn.provider]) grouped[conn.provider] = [];
    grouped[conn.provider].push(conn);
  }

  const allDiscovered = [];

  for (const [provider, conns] of Object.entries(grouped)) {
    console.log(`▶️ Descubriendo recursos para ${provider}...`);
    try {
      const modulePath = path.join(__dirname, 'discover', `${provider}.js`);
      const discoverFn = require(modulePath);

      for (const conn of conns) {
        const resources = await discoverFn(conn);
        allDiscovered.push(...resources);

        await fetch('http://localhost:3002/api/syncResources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resources)
        });
      }
    } catch (err) {
      console.error(`❌ Error al descubrir ${provider}:`, err.message);
    }
  }

  res.send({ success: true, discovered: allDiscovered.length });
});

app.listen(3000, () => console.log('✅ CloudView CMDB backend listo en http://localhost:3000'));