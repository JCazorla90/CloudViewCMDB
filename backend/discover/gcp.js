const { google } = require('googleapis');

module.exports = async function discoverGCP(connection) {
  const resources = [];

  const auth = new google.auth.GoogleAuth({
    credentials: connection.credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  const compute = google.compute({ version: 'v1', auth });

  const res = await compute.instances.aggregatedList({
    project: connection.credentials.project_id
  });

  for (const zone in res.data.items) {
    const instances = res.data.items[zone].instances || [];
    for (const instance of instances) {
      resources.push({
        externalId: instance.id,
        type: 'compute_instance',
        provider: 'gcp',
        name: instance.name,
        region: zone,
        metadata: {
          status: instance.status,
          machineType: instance.machineType
        }
      });
    }
  }

  return resources;
};