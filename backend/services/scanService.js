const mongoose = require('mongoose');
const AWSConnector = require('../connectors/aws/awsConnector');
const AzureConnector = require('../connectors/azure/azureConnector');
const IBMCloudConnector = require('../connectors/ibm/ibmConnector');

const ResourceModel = require('../models/resourceModel');
const ConnectionModel = require('../models/connectionModel');
const ScanJobModel = require('../models/scanJobModel');

class ScanService {
  constructor() {
    this.connectors = {};
  }

  async initializeConnector(providerId, credentials) {
    try {
      let connector;
      
      switch (providerId) {
        case 'aws':
          connector = new AWSConnector(credentials);
          break;
        case 'azure':
          connector = new AzureConnector(credentials);
          break;
        case 'ibm':
          connector = new IBMCloudConnector(credentials);
          break;
        default:
          throw new Error(`Proveedor no soportado: ${providerId}`);
      }
      
      await connector.initialize();
      this.connectors[providerId] = connector;
      
      return true;
    } catch (error) {
      console.error(`Error al inicializar conector para ${providerId}:`, error);
      throw error;
    }
  }

  async scanProvider(connectionId) {
    try {
      // Buscar la conexión en la base de datos
      const connection = await ConnectionModel.findById(connectionId);
      if (!connection) {
        throw new Error(`Conexión no encontrada con ID: ${connectionId}`);
      }
      
      // Crear un trabajo de escaneo
      const scanJob = await ScanJobModel.create({
        connectionId,
        provider: connection.provider,
        status: 'running',
        startTime: new Date()
      });
      
      // Inicializar el conector si no existe
      if (!this.connectors[connection.provider]) {
        await this.initializeConnector(connection.provider, connection.credentials);
      }
      
      // Ejecutar el escaneo
      const resources = await this.connectors[connection.provider].scanResources();
      
      // Procesar y guardar recursos en la base de datos
      await this.processAndStoreResources(resources, connection);
      
      // Actualizar estado del trabajo
      scanJob.status = 'completed';
      scanJob.endTime = new Date();
      scanJob.resourceCount = await this.countResourcesForConnection(connectionId);
      await scanJob.save();
      
      return {
        jobId: scanJob._id,
        status: scanJob.status,
        resourceCount: scanJob.resourceCount
      };
    } catch (error) {
      console.error(`Error al escanear proveedor:`, error);
      
      // Actualizar estado del trabajo si existe
      if (scanJob) {
        scanJob.status = 'failed';
        scanJob.endTime = new Date();
        scanJob.error = error.message;
        await scanJob.save();
      }
      
      throw error;
    }
  }

  async processAndStoreResources(resources, connection) {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Eliminar recursos anteriores de esta conexión
        await ResourceModel.deleteMany({ connectionId: connection._id }, { session });
        
        // Array para almacenar todos los recursos a insertar
        const resourcestoInsert = [];
        
        // Función recursiva para procesar recursos y detectar relaciones
        const processResource = (data, type, parent = null) => {
          const baseResource = {
            connectionId: connection._id,
            provider: connection.provider,
            resourceType: type,
            data: data,
            parent: parent,
            createdAt: new Date()
          };
          
          resourcestoInsert.push(baseResource);
          
          // Devolver el ID temporal para establecer relaciones
          return resourcestoInsert.length - 1;
        };
        
        // Procesar recursos según el proveedor
        switch (connection.provider) {
          case 'aws':
            this.processAWSResources(resources, processResource);
            break;
          case 'azure':
            this.processAzureResources(resources, processResource);
            break;
          case 'ibm':
            this.processIBMResources(resources, processResource);
            break;
        }
        
        // Insertar todos los recursos de una vez
        await ResourceModel.insertMany(resourcestoInsert, { session });
        
        await session.commitTransaction();
        session.endSession();
        
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error al procesar y almacenar recursos:', error);
      throw error;
    }
  }

  processAWSResources(resources, processResource) {
    // Procesar instancias EC2
    if (resources.ec2) {
      resources.ec2.forEach(instance => {
        const instanceId = processResource(instance, 'ec2');
        
        // Procesar relaciones con VPC y Subnet
        if (instance.vpcId) {
          const vpc = resources.vpc.vpcs.find(vpc => vpc.id === instance.vpcId);
          if (vpc) {
            const vpcId = processResource(vpc, 'vpc');
            // Establecer relación bidireccional
            resourcestoInsert[instanceId].relations = resourcestoInsert[instanceId].relations || [];
            resourcestoInsert[instanceId].relations.push({ type: 'belongs_to', targetType: 'vpc', targetId: vpcId });
          }
        }
        
        if (instance.subnetId) {
          const subnet = resources.vpc.subnets.find(subnet => subnet.id === instance.subnetId);
          if (subnet) {
            const subnetId = processResource(subnet, 'subnet');
            // Establecer relación bidireccional
            resourcestoInsert[instanceId].relations = resourcestoInsert[instanceId].relations || [];
            resourcestoInsert[instanceId].relations.push({ type: 'belongs_to', targetType: 'subnet', targetId: subnetId });
          }
        }
      });
    }
    
    // Procesar buckets S3
    if (resources.s3) {
      resources.s3.forEach(bucket => {
        processResource(bucket, 's3');
      });
    }
    
    // Procesar bases de datos RDS
    if (resources.rds) {
      resources.rds.forEach(db => {
        const dbId = processResource(db, 'rds');
        
        // Procesar relaciones con VPC
        if (db.vpcId) {
          const vpc = resources.vpc.vpcs.find(vpc => vpc.id === db.vpcId);
          if (vpc) {
            const vpcId = processResource(vpc, 'vpc');
            // Establecer relación
            resourcestoInsert[dbId].relations = resourcestoInsert[dbId].relations || [];
            resourcestoInsert[dbId].relations.push({ type: 'belongs_to', targetType: 'vpc', targetId: vpcId });
          }
        }
      });
    }
    
    // Procesar funciones Lambda
    if (resources.lambda) {
      resources.lambda.forEach(func => {
        processResource(func, 'lambda');
      });
    }
    
    // Procesar recursos de red
    if (resources.vpc) {
      // VPCs
      resources.vpc.vpcs.forEach(vpc => {
        processResource(vpc, 'vpc');
      });
      
      // Subnets
      resources.vpc.subnets.forEach(subnet => {
        const subnetId = processResource(subnet, 'subnet');
        
        // Relación con VPC
        const vpc = resources.vpc.vpcs.find(vpc => vpc.id === subnet.vpcId);
        if (vpc) {
          const vpcId = processResource(vpc, 'vpc');
          resourcestoInsert[subnetId].relations = resourcestoInsert[subnetId].relations || [];
          resourcestoInsert[subnetId].relations.push({ type: 'belongs_to', targetType: 'vpc', targetId: vpcId });
        }
      });
      
      // Security Groups
      resources.vpc.securityGroups.forEach(sg => {
        const sgId = processResource(sg, 'security_group');
        
        // Relación con VPC
        if (sg.vpcId) {
          const vpc = resources.vpc.vpcs.find(vpc => vpc.id === sg.vpcId);
          if (vpc) {
            const vpcId = processResource(vpc, 'vpc');
            resourcestoInsert[sgId].relations = resourcestoInsert[sgId].relations || [];
            resourcestoInsert[sgId].relations.push({ type: 'belongs_to', targetType: 'vpc', targetId: vpcId });
          }
        }
      });
      
      // Route Tables
      resources.vpc.routeTables.forEach(rt => {
        const rtId = processResource(rt, 'route_table');
        
        // Relación con VPC
        if (rt.vpcId) {
          const vpc = resources.vpc.vpcs.find(vpc => vpc.id === rt.vpcId);
          if (vpc) {
            const vpcId = processResource(vpc, 'vpc');
            resourcestoInsert[rtId].relations = resourcestoInsert[rtId].relations || [];
            resourcestoInsert[rtId].relations.push({ type: 'belongs_to', targetType: 'vpc', targetId: vpcId });
          }
        }
      });
    }
    
    // Procesar recursos IAM
    if (resources.iam) {
      // Usuarios
      resources.iam.users.forEach(user => {
        processResource(user, 'iam_user');
      });
      
      // Roles
      resources.iam.roles.forEach(role => {
        processResource(role, 'iam_role');
      });
      
      // Políticas
      resources.iam.policies.forEach(policy => {
        processResource(policy, 'iam_policy');
      });
    }
  }

  processAzureResources(resources, processResource) {
    // Procesar grupos de recursos
    if (resources.resourceGroups) {
      resources.resourceGroups.forEach(group => {
        processResource(group, 'resource_group');
      });
    }
    
    // Procesar máquinas virtuales
    if (resources.virtualMachines) {
      resources.virtualMachines.forEach(vm => {
        const vmId = processResource(vm, 'virtual_machine');
        
        // Relación con grupo de recursos
        const group = resources.resourceGroups.find(group => group.name === vm.resourceGroup);
        if (group) {
          const groupId = processResource(group, 'resource_group');
          resourcestoInsert[vmId].relations = resourcestoInsert[vmId].relations || [];
          resourcestoInsert[vmId].relations.push({ type: 'belongs_to', targetType: 'resource_group', targetId: groupId });
        }
      });
    }
    
    // Procesar redes virtuales
    if (resources.virtualNetworks) {
      // VNets
      resources.virtualNetworks.virtualNetworks.forEach(vnet => {
        const vnetId = processResource(vnet, 'virtual_network');
        
        // Relación con grupo de recursos
        const group = resources.resourceGroups.find(group => group.name === vnet.resourceGroup);
        if (group) {
          const groupId = processResource(group, 'resource_group');
          resourcestoInsert[vnetId].relations = resourcestoInsert[vnetId].relations || [];
          resourcestoInsert[vnetId].relations.push({ type: 'belongs_to', targetType: 'resource_group', targetId: groupId });
        }
      });
      
      // Subnets
      resources.virtualNetworks.subnets.forEach(subnet => {
        const subnetId = processResource(subnet, 'subnet');
        
        // Relación con VNet
        const vnet = resources.virtualNetworks.virtualNetworks.find(vnet => vnet.name === subnet.virtualNetworkName);
        if (vnet) {
          const vnetId = processResource(vnet, 'virtual_network');
          resourcestoInsert[subnetId].relations = resourcestoInsert[subnetId].relations || [];
          resourcestoInsert[subnetId].relations.push({ type: 'belongs_to', targetType: 'virtual_network', targetId: vnetId });
        }
      });
      
      // NSGs
      resources.virtualNetworks.securityGroups.forEach(nsg => {
        const nsgId = processResource(nsg, 'network_security_group');
        
        // Relación con grupo de recursos
        const group = resources.resourceGroups.find(group => group.name === nsg.resourceGroup);
        if (group) {
          const groupId = processResource(group, 'resource_group');
          resourcestoInsert[nsgId].relations = resourcestoInsert[nsgId].relations || [];
          resourcestoInsert[nsgId].relations.push({ type: 'belongs_to', targetType: 'resource_group', targetId: groupId });
        }
      });
    }
    
    // Procesar cuentas de almacenamiento
    if (resources.storageAccounts) {
      resources.storageAccounts.forEach(account => {
        const accountId = processResource(account, 'storage_account');
        
        // Relación con grupo de recursos
        const group = resources.resourceGroups.find(group => group.name === account.resourceGroup);
        if (group) {
          const groupId = processResource(group, 'resource_group');
          resourcestoInsert[accountId].relations = resourcestoInsert[accountId].relations || [];
          resourcestoInsert[accountId].relations.push({ type: 'belongs_to', targetType: 'resource_group', targetId: groupId });
        }
      });
    }
    
    // Procesar SQL servers y databases
    if (resources.sqlServers) {
      // Servidores
      resources.sqlServers.servers.forEach(server => {
        const serverId = processResource(server, 'sql_server');
        
        // Relación con grupo de recursos
        const group = resources.resourceGroups.find(group => group.name === server.resourceGroup);
        if (group) {
          const groupId = processResource(group, 'resource_group');
          resourcestoInsert[serverId].relations = resourcestoInsert[serverId].relations || [];
          resourcestoInsert[serverId].relations.push({ type: 'belongs_to', targetType: 'resource_group', targetId: groupId });
        }
      });
      
      // Bases de datos
      resources.sqlServers.databases.forEach(db => {
        const dbId = processResource(db, 'sql_database');
        
        // Relación con servidor
        const server = resources.sqlServers.servers.find(server => server.id === db.serverId);
        if (server) {
          const serverId = processResource(server, 'sql_server');
          resourcestoInsert[dbId].relations = resourcestoInsert[dbId].relations || [];
          resourcestoInsert[dbId].relations.push({ type: 'belongs_to', targetType: 'sql_server', targetId: serverId });
        }
      });
    }
  }

  processIBMResources(resources, processResource) {
    // Procesar grupos de recursos
    if (resources.resourceGroups) {
      resources.resourceGroups.forEach(group => {
        processResource(group, 'resource_group');
      });
    }
    
    // Procesar instancias de servicio
    if (resources.instances) {
      resources.instances.forEach(instance => {
        const instanceId = processResource(instance, 'service_instance');
        
        // Relación con grupo de recursos
        const group = resources.resourceGroups.find(group => group.id === instance.resourceGroupId);
        if (group) {
          const groupId = processResource(group, 'resource_group');
          resourcestoInsert[instanceId].relations = resourcestoInsert[instanceId].relations || [];
          resourcestoInsert[instanceId].relations.push({ type: 'belongs_to', targetType: 'resource_group', targetId: groupId });
        }
      });
    }
    
    // Procesar recursos VPC
    if (resources.vpc) {
      // VPCs
      resources.vpc.vpcs.forEach(vpc => {
        const vpcId = processResource(vpc, 'vpc');
        
        // Relación con grupo de recursos si existe
        if (vpc.resourceGroup) {
          const group = resources.resourceGroups.find(group => group.id === vpc.resourceGroup.id);
          if (group) {
            const groupId = processResource(group, 'resource_group');
            resourcestoInsert[vpcId].relations = resourcestoInsert[vpcId].relations || [];
            resourcestoInsert[vpcId].relations.push({ type: 'belongs_to', targetType: 'resource_group', targetId: groupId });
          }
        }
      });
      
      // Subnets
      resources.vpc.subnets.forEach(subnet => {
        const subnetId = processResource(subnet, 'subnet');
        
        // Relación con VPC
        const vpc = resources.vpc.vpcs.find(vpc => vpc.id === subnet.vpcId);
        if (vpc) {
          const vpcId = processResource(vpc, 'vpc');
          resourcestoInsert[subnetId].relations = resourcestoInsert[subnetId].relations || [];
          resourcestoInsert[subnetId].relations.push({ type: 'belongs_to', targetType: 'vpc', targetId: vpcId });
        }
      });
      
      // Instancias
      resources.vpc.instances.forEach(instance => {
        const instanceId = processResource(instance, 'vpc_instance');
        
        // Relación con VPC
        const vpc = resources.vpc.vpcs.find(vpc => vpc.id === instance.vpcId);
        if (vpc) {
          const vpcId = processResource(vpc, 'vpc');
          resourcestoInsert[instanceId].relations = resourcestoInsert[instanceId].relations || [];
          resourcestoInsert[instanceId].relations.push({ type: 'belongs_to', targetType: 'vpc', targetId: vpcId });
        }
      });
      
      // Security Groups
      resources.vpc.securityGroups.forEach(sg => {
        const sgId = processResource(sg, 'security_group');
        
        // Relación con VPC
        const vpc = resources.vpc.vpcs.find(vpc => vpc.id === sg.vpcId);
        if (vpc) {
          const vpcId = processResource(vpc, 'vpc');
          resourcestoInsert[sgId].relations = resourcestoInsert[sgId].relations || [];
          resourcestoInsert[sgId].relations.push({ type: 'belongs_to', targetType: 'vpc', targetId: vpcId });
        }
      });
    }
    
    // Procesar usuarios
    if (resources.users) {
      resources.users.forEach(user => {
        processResource(user, 'user');
      });
    }
  }

  async countResourcesForConnection(connectionId) {
    return await ResourceModel.countDocuments({ connectionId });
  }
}

module.exports = new ScanService();