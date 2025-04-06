const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const app = express();
app.use(cors());
app.use(express.json());

const MODE = process.env.AUDIT_MODE || 'mock';

app.get('/api/auditLogs', async (req, res) => {
  if (MODE === 'mock') {
    const now = Date.now();
    return res.json([
      {
        eventType: 'resource_create',
        resourceId: 'i-ec2-001',
        user: 'system',
        details: JSON.stringify({ name: 'EC2', region: 'us-east-1' }),
        timestamp: now - 60000
      },
      {
        eventType: 'resource_update',
        resourceId: 'r-lambda-987',
        user: 'admin',
        details: JSON.stringify({ region: ['us-east-1', 'eu-west-1'] }),
        timestamp: now - 30000
      },
      {
        eventType: 'resource_delete',
        resourceId: 'db-old-xyz',
        user: 'system',
        details: '{}',
        timestamp: now
      }
    ]);
  } else {
    try {
      const web3 = new Web3(process.env.WEB3_RPC_URL || 'http://localhost:8545');
      const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'AuditLog.abi.json')));
      const contractAddress = process.env.AUDIT_CONTRACT_ADDRESS;
      const contract = new web3.eth.Contract(abi, contractAddress);

      const logs = await contract.getPastEvents('ChangeLogged', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      const formatted = logs.map(log => ({
        eventType: log.returnValues.eventType,
        resourceId: log.returnValues.resourceId,
        user: log.returnValues.user,
        details: log.returnValues.details,
        timestamp: Number(log.returnValues.timestamp) * 1000
      }));

      return res.json(formatted);
    } catch (err) {
      console.error('❌ Error obteniendo logs de blockchain:', err.message);
      return res.status(500).json({ error: 'Blockchain unavailable' });
    }
  }
});

app.listen(3030, () => console.log(`🔐 API de auditoría corriendo en modo ${MODE} en http://localhost:3030`));