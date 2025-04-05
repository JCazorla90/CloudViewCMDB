const { DefaultAzureCredential } = require('@azure/identity');
const { ComputeManagementClient } = require('@azure/arm-compute');

module.exports = async function discoverAzure(connection) {
  const resources = [];

  const credential = new DefaultAzureCredential();
  const client = new ComputeManagementClient(credential, connection.credentials.subscriptionId);

  const vms = await client.virtualMachines.listAll();

  for await (const vm of vms) {
    resources.push({
      externalId: vm.id,
      type: 'virtual_machine',
      provider: 'azure',
      name: vm.name,
      region: vm.location,
      metadata: vm.tags || {}
    });
  }

  return resources;
};