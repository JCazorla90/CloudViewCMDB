const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { logAudit } = require('./blockchain/auditLogger');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/cmdb');

const Resource = mongoose.model('Resource', new mongoose.Schema({
  externalId: String,
  type: String,
  provider: String,
  name: String,
  region: String,
  metadata: Object,
  updatedAt: { type: Date, default: Date.now }
}));

const ChangeLog = mongoose.model('ChangeLog', new mongoose.Schema({
  resourceId: String,
  type: String,
  changes: Object,
  timestamp: { type: Date, default: Date.now }
}));

// --- Sync Resources con auditoría blockchain ---
app.post('/api/syncResources', async (req, res) => {
  const newResources = req.body;

  for (const newRes of newResources) {
    const existing = await Resource.findOne({ externalId: newRes.externalId });
    if (!existing) {
      await Resource.create(newRes);
      await ChangeLog.create({ resourceId: newRes.externalId, type: 'create', changes: newRes });
      await logAudit('resource_create', newRes.externalId, 'system', JSON.stringify(newRes));
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
        await logAudit('resource_update', newRes.externalId, 'system', JSON.stringify(diffs));
      }
    }
  }

  const existingIds = (await Resource.find()).map(r => r.externalId);
  const newIds = newResources.map(r => r.externalId);
  const deleted = existingIds.filter(id => !newIds.includes(id));
  for (const id of deleted) {
    await Resource.deleteOne({ externalId: id });
    await ChangeLog.create({ resourceId: id, type: 'delete', changes: {} });
    await logAudit('resource_delete', id, 'system', '{}');
  }

  res.send({ success: true });
});

app.listen(3000, () => console.log('🌐 API CMDB con auditoría escuchando en http://localhost:3000'));