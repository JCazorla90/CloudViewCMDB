const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const web3 = new Web3('http://localhost:8545'); // Ganache o red privada

const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'AuditLog.abi.json')));
const bytecode = fs.readFileSync(path.join(__dirname, 'AuditLog.bytecode.txt'), 'utf-8');

async function deploy() {
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  console.log('🚀 Desplegando contrato desde cuenta:', deployer);

  const contract = new web3.eth.Contract(abi);

  const instance = await contract.deploy({ data: bytecode }).send({
    from: deployer,
    gas: 3000000
  });

  console.log('✅ Contrato desplegado en:', instance.options.address);
}

deploy().catch(err => console.error('❌ Error desplegando contrato:', err));