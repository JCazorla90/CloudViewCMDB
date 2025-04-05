module.exports = async function discoverIBM(connection) {
  // Placeholder de ejemplo - requiere IBM SDK real
  return [
    {
      externalId: 'ibm-vm-123',
      type: 'virtual_server',
      provider: 'ibm',
      name: 'vm-123',
      region: 'eu-de',
      metadata: { os: 'linux' }
    }
  ];
};