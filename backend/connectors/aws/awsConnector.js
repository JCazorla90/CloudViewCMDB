
const AWS = require('aws-sdk');

class AWSConnector {
  constructor(credentials) {
    this.credentials = credentials;
    this.services = {};
    this.regions = ['us-east-1', 'us-west-1', 'eu-west-1']; // Regiones por defecto, ampliables
  }

  async initialize() {
    try {
      // Configurar credenciales AWS
      AWS.config.update({
        accessKeyId: this.credentials.accessKeyId,
        secretAccessKey: this.credentials.secretAccessKey,
        region: this.credentials.region || 'us-east-1'
      });
      
      console.log('AWS Connector inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar AWS Connector:', error);
      throw error;
    }
  }

  async scanResources() {
    const resources = {
      ec2: await this.scanEC2(),
      s3: await this.scanS3(),
      rds: await this.scanRDS(),
      lambda: await this.scanLambda(),
      vpc: await this.scanVPC(),
      iam: await this.scanIAM()
    };

    return resources;
  }

  async scanEC2() {
    try {
      const instances = [];
      
      for (const region of this.regions) {
        AWS.config.update({ region });
        const ec2 = new AWS.EC2();
        
        const response = await ec2.describeInstances().promise();
        
        for (const reservation of response.Reservations) {
          for (const instance of reservation.Instances) {
            instances.push({
              id: instance.InstanceId,
              type: instance.InstanceType,
              state: instance.State.Name,
              privateIp: instance.PrivateIpAddress,
              publicIp: instance.PublicIpAddress,
              vpcId: instance.VpcId,
              subnetId: instance.SubnetId,
              tags: instance.Tags,
              region
            });
          }
        }
      }
      
      return instances;
    } catch (error) {
      console.error('Error al escanear instancias EC2:', error);
      return [];
    }
  }

  async scanS3() {
    try {
      AWS.config.update({ region: 'us-east-1' }); // S3 es un servicio global
      const s3 = new AWS.S3();
      
      const response = await s3.listBuckets().promise();
      const buckets = response.Buckets.map(bucket => ({
        name: bucket.Name,
        creationDate: bucket.CreationDate
      }));
      
      // Obtener detalles adicionales para cada bucket
      for (const bucket of buckets) {
        try {
          const location = await s3.getBucketLocation({ Bucket: bucket.name }).promise();
          bucket.region = location.LocationConstraint || 'us-east-1';
          
          const encryption = await s3.getBucketEncryption({ Bucket: bucket.name }).promise().catch(() => null);
          bucket.encryption = encryption ? encryption.ServerSideEncryptionConfiguration : null;
          
          const policy = await s3.getBucketPolicy({ Bucket: bucket.name }).promise().catch(() => null);
          bucket.policy = policy ? JSON.parse(policy.Policy) : null;
        } catch (err) {
          console.warn(`No se pudo obtener detalles completos para el bucket ${bucket.name}:`, err.message);
        }
      }
      
      return buckets;
    } catch (error) {
      console.error('Error al escanear buckets S3:', error);
      return [];
    }
  }

  async scanRDS() {
    try {
      const databases = [];
      
      for (const region of this.regions) {
        AWS.config.update({ region });
        const rds = new AWS.RDS();
        
        const response = await rds.describeDBInstances().promise();
        
        for (const db of response.DBInstances) {
          databases.push({
            id: db.DBInstanceIdentifier,
            engine: db.Engine,
            version: db.EngineVersion,
            status: db.DBInstanceStatus,
            endpoint: db.Endpoint ? db.Endpoint.Address : null,
            port: db.Endpoint ? db.Endpoint.Port : null,
            storage: db.AllocatedStorage,
            instanceClass: db.DBInstanceClass,
            multiAZ: db.MultiAZ,
            vpcId: db.DBSubnetGroup ? db.DBSubnetGroup.VpcId : null,
            region
          });
        }
      }
      
      return databases;
    } catch (error) {
      console.error('Error al escanear instancias RDS:', error);
      return [];
    }
  }

  async scanLambda() {
    try {
      const functions = [];
      
      for (const region of this.regions) {
        AWS.config.update({ region });
        const lambda = new AWS.Lambda();
        
        const response = await lambda.listFunctions().promise();
        
        for (const func of response.Functions) {
          functions.push({
            name: func.FunctionName,
            arn: func.FunctionArn,
            runtime: func.Runtime,
            handler: func.Handler,
            codeSize: func.CodeSize,
            timeout: func.Timeout,
            memory: func.MemorySize,
            lastModified: func.LastModified,
            region
          });
        }
      }
      
      return functions;
    } catch (error) {
      console.error('Error al escanear funciones Lambda:', error);
      return [];
    }
  }

  async scanVPC() {
    try {
      const networks = {
        vpcs: [],
        subnets: [],
        securityGroups: [],
        routeTables: []
      };
      
      for (const region of this.regions) {
        AWS.config.update({ region });
        const ec2 = new AWS.EC2();
        
        // Obtener VPCs
        const vpcResponse = await ec2.describeVpcs().promise();
        for (const vpc of vpcResponse.Vpcs) {
          networks.vpcs.push({
            id: vpc.VpcId,
            cidr: vpc.CidrBlock,
            isDefault: vpc.IsDefault,
            state: vpc.State,
            tags: vpc.Tags,
            region
          });
        }
        
        // Obtener Subnets
        const subnetResponse = await ec2.describeSubnets().promise();
        for (const subnet of subnetResponse.Subnets) {
          networks.subnets.push({
            id: subnet.SubnetId,
            vpcId: subnet.VpcId,
            cidr: subnet.CidrBlock,
            availabilityZone: subnet.AvailabilityZone,
            state: subnet.State,
            tags: subnet.Tags,
            region
          });
        }
        
        // Obtener Security Groups
        const sgResponse = await ec2.describeSecurityGroups().promise();
        for (const sg of sgResponse.SecurityGroups) {
          networks.securityGroups.push({
            id: sg.GroupId,
            name: sg.GroupName,
            vpcId: sg.VpcId,
            description: sg.Description,
            inboundRules: sg.IpPermissions,
            outboundRules: sg.IpPermissionsEgress,
            tags: sg.Tags,
            region
          });
        }
        
        // Obtener Route Tables
        const rtResponse = await ec2.describeRouteTables().promise();
        for (const rt of rtResponse.RouteTables) {
          networks.routeTables.push({
            id: rt.RouteTableId,
            vpcId: rt.VpcId,
            routes: rt.Routes,
            associations: rt.Associations,
            tags: rt.Tags,
            region
          });
        }
      }
      
      return networks;
    } catch (error) {
      console.error('Error al escanear recursos de red:', error);
      return { vpcs: [], subnets: [], securityGroups: [], routeTables: [] };
    }
  }

  async scanIAM() {
    try {
      AWS.config.update({ region: 'us-east-1' }); // IAM es un servicio global
      const iam = new AWS.IAM();
      
      // Obtener usuarios
      const userResponse = await iam.listUsers().promise();
      const users = userResponse.Users.map(user => ({
        id: user.UserId,
        name: user.UserName,
        arn: user.Arn,
        created: user.CreateDate,
        path: user.Path
      }));
      
      // Obtener roles
      const roleResponse = await iam.listRoles().promise();
      const roles = roleResponse.Roles.map(role => ({
        id: role.RoleId,
        name: role.RoleName,
        arn: role.Arn,
        created: role.CreateDate,
        path: role.Path,
        trustPolicy: role.AssumeRolePolicyDocument
      }));
      
      // Obtener políticas
      const policyResponse = await iam.listPolicies().promise();
      const policies = policyResponse.Policies.map(policy => ({
        id: policy.PolicyId,
        name: policy.PolicyName,
        arn: policy.Arn,
        created: policy.CreateDate,
        updateDate: policy.UpdateDate,
        version: policy.DefaultVersionId,
        path: policy.Path
      }));
      
      return { users, roles, policies };
    } catch (error) {
      console.error('Error al escanear recursos IAM:', error);
      return { users: [], roles: [], policies: [] };
    }
  }
}

module.exports = AWSConnector;