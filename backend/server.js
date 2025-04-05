const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

const rules = JSON.parse(fs.readFileSync('./complianceRules.json'));

function getField(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

app.post('/api/compliance/check', (req, res) => {
  const results = req.body.map(resource => {
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

app.listen(3003, () => console.log('Compliance checker running on http://localhost:3003'));