const AWS = require('aws-sdk');

module.exports = async function discoverAWS(connection) {
  const resources = [];
  AWS.config.update({
    accessKeyId: connection.credentials?.accessKeyId,
    secretAccessKey: connection.credentials?.secretAccessKey,
    region: connection.credentials?.region || 'us-east-1'
  });

  const ec2 = new AWS.EC2();
  const s3 = new AWS.S3();

  const instances = await ec2.describeInstances().promise();
  instances.Reservations.forEach(res => {
    res.Instances.forEach(instance => {
      resources.append({
        externalId: instance.InstanceId,
        type: 'ec2',
        provider: 'aws',
        name: instance.InstanceId,
        region: instance.Placement.AvailabilityZone,
        metadata: {
          state: instance.State?.Name,
          instanceType: instance.InstanceType,
          tags: instance.Tags?.length > 0
        }
      });
    });
  });

  const buckets = await s3.listBuckets().promise();
  for (const bucket of buckets.Buckets) {
    resources.push({
      externalId: bucket.Name,
      type: 's3',
      provider: 'aws',
      name: bucket.Name,
      region: 'global',
      metadata: {}
    });
  }

  return resources;
};