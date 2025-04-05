const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// URL de Ganache local o red privada
const web3 = new Web3('http://localhost:8545');

// ABI del contrato
const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'AuditLog.abi.json')));
const contractAddress = '0xYourContractAddressHere'; // Reemplazar con la dirección desplegada

const auditContract = new web3.eth.Contract(abi, contractAddress);

// Cuenta que emitirá las transacciones (sin gas si usas Ganache local)
const fromAccount = '0xYourGanacheAccountHere';

async function logAudit(eventType, resourceId, user, details) {
  try {
    await auditContract.methods.logChange(eventType, resourceId, user, details).send({ from: fromAccount });
    console.log('✅ Evento auditado en blockchain');
  } catch (err) {
    console.error('❌ Error auditando evento:', err.message);
  }
}

module.exports = { logAudit };