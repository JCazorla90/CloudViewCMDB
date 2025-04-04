
const { ClientSecretCredential } = require('@azure/identity');
const { ResourceManagementClient } = require('@azure/arm-resources');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { NetworkManagementClient } = require('@azure/arm-network');
const { StorageManagementClient } = require('@azure/arm-storage');
const { SqlManagementClient } = require('@azure/arm-sql');

class AzureConnector {
  constructor(credentials) {
    this.credentials = credentials;
    this.clients = {};
    this.subscriptionId = credentials.subscriptionId;
  }

  async initialize() {
    try {
      // Configurar credenciales de Azure
      const credential = new ClientSecretCredential(
        this.credentials.tenantId,
        this.credentials.clientId,
        this.credentials.clientSecret
      );
      
      // Inicializar clientes de Azure
      this.clients.resource = new ResourceManagementClient(credential, this.subscriptionId);
      this.clients.compute = new ComputeManagementClient(credential, this.subscriptionId);
      this.clients.network = new NetworkManagementClient(credential, this.subscriptionId);
      this.clients.storage = new StorageManagementClient(credential, this.subscriptionId);
      this.clients.sql = new SqlManagementClient(credential, this.subscriptionId);
      
      console.log('Azure Connector inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar Azure Connector:', error);
      throw error;
    }
  }

  async scanResources() {
    const resources = {
      resourceGroups: await this.scanResourceGroups(),
      virtualMachines: await this.scanVirtualMachines(),
      virtualNetworks: await this.scanVirtualNetworks(),
      storageAccounts: await this.scanStorageAccounts(),
      sqlServers: await this.scanSqlServers()
    };

    return resources;
  }

  async scanResourceGroups() {
    try {
      const resourceGroups = [];
      const result = await this.clients.resource.resourceGroups.list();
      
      for await (const group of result) {
        resourceGroups.push({
          id: group.id,
          name: group.name,
          location: group.location,
          type: group.type,
          tags: group.tags,
          properties: group.properties
        });
      }
      
      return resourceGroups;
    } catch (error) {
      console.error('Error al escanear grupos de recursos:', error);
      return [];
    }
  }

  async scanVirtualMachines() {
    try {
      const virtualMachines = [];
      const resourceGroups = await this.scanResourceGroups();
      
      for (const group of resourceGroups) {
        const vms = await this.clients.compute.virtualMachines.listByResourceGroup(group.name);
        
        for await (const vm of vms) {
          // Obtener información de red para la VM
          const networkInterfaces = [];
          if (vm.networkProfile && vm.networkProfile.networkInterfaces) {
            for (const nic of vm.networkProfile.networkInterfaces) {
              const nicId = nic.id;
              const nicName = nicId.split('/').pop();
              const nicResourceGroup = nicId.split('/').filter(part => part !== '')[3];
              
              try {
                const nicDetails = await this.clients.network.networkInterfaces.get(nicResourceGroup, nicName);
                networkInterfaces.push({
                  id: nicDetails.id,
                  name: nicDetails.name,
                  privateIp: nicDetails.ipConfigurations[0]?.privateIPAddress,
                  publicIpId: nicDetails.ipConfigurations[0]?.publicIPAddress?.id
                });
                
                // Si tiene IP pública, obtenerla
                if (nicDetails.ipConfigurations[0]?.publicIPAddress?.id) {
                  const publicIpId = nicDetails.ipConfigurations[0].publicIPAddress.id;
                  const publicIpName = publicIpId.split('/').pop();
                  const publicIpResourceGroup = publicIpId.split('/').filter(part => part !== '')[3];
                  
                  try {
                    const publicIp = await this.clients.network.publicIPAddresses.get(publicIpResourceGroup, publicIpName);
                    if (networkInterfaces[networkInterfaces.length - 1]) {
                      networkInterfaces[networkInterfaces.length - 1].publicIp = publicIp.ipAddress;
                    }
                  } catch (err) {
                    console.warn(`No se pudo obtener IP pública para ${nicName}:`, err.message);
                  }
                }
              } catch (err) {
                console.warn(`No se pudo obtener detalles para la interfaz de red ${nicName}:`, err.message);
              }
            }
          }
          
          virtualMachines.push({
            id: vm.id,
            name: vm.name,
            resourceGroup: group.name,
            location: vm.location,
            size: vm.hardwareProfile?.vmSize,
            osType: vm.storageProfile?.osDisk?.osType,
            osDisk: {
              name: vm.storageProfile?.osDisk?.name,
              diskSizeGB: vm.storageProfile?.osDisk?.diskSizeGB
            },
            dataDisks: vm.storageProfile?.dataDisks?.map(disk => ({
              name: disk.name,
              diskSizeGB: disk.diskSizeGB,
              lun: disk.lun
            })),
            networkInterfaces,
            provisioningState: vm.provisioningState,
            tags: vm.tags
          });
        }
      }
      
      return virtualMachines;
    } catch (error) {
      console.error('Error al escanear máquinas virtuales:', error);
      return [];
    }
  }

  async scanVirtualNetworks() {
    try {
      const networks = {
        virtualNetworks: [],
        subnets: [],
        securityGroups: [],
        routeTables: []
      };
      
      const resourceGroups = await this.scanResourceGroups();
      
      // Escanear VNets
      for (const group of resourceGroups) {
        const vnets = await this.clients.network.virtualNetworks.list(group.name);
        
        for await (const vnet of vnets) {
          networks.virtualNetworks.push({
            id: vnet.id,
            name: vnet.name,
            resourceGroup: group.name,
            location: vnet.location,
            addressSpace: vnet.addressSpace?.addressPrefixes,
            enableDdosProtection: vnet.enableDdosProtection,
            tags: vnet.tags
          });
          
          // Extraer subredes
          if (vnet.subnets) {
            for (const subnet of vnet.subnets) {
              networks.subnets.push({
                id: subnet.id,
                name: subnet.name,
                virtualNetworkName: vnet.name,
                resourceGroup: group.name,
                addressPrefix: subnet.addressPrefix,
                networkSecurityGroup: subnet.networkSecurityGroup?.id,
                routeTable: subnet.routeTable?.id
              });
            }
          }
        }
        
        // Escanear NSGs
        const nsgs = await this.clients.network.networkSecurityGroups.list(group.name);
        
        for await (const nsg of nsgs) {
          networks.securityGroups.push({
            id: nsg.id,
            name: nsg.name,
            resourceGroup: group.name,
            location: nsg.location,
            securityRules: nsg.securityRules?.map(rule => ({
              name: rule.name,
              priority: rule.priority,
              direction: rule.direction,
              access: rule.access,
              protocol: rule.protocol,
              sourceAddressPrefix: rule.sourceAddressPrefix,
              destinationAddressPrefix: rule.destinationAddressPrefix,
              sourcePortRange: rule.sourcePortRange,
              destinationPortRange: rule.destinationPortRange
            })),
            tags: nsg.tags
          });
        }
        
        // Escanear Route Tables
        const routeTables = await this.clients.network.routeTables.list(group.name);
        
        for await (const rt of routeTables) {
          networks.routeTables.push({
            id: rt.id,
            name: rt.name,
            resourceGroup: group.name,
            location: rt.location,
            routes: rt.routes?.map(route => ({
              name: route.name,
              addressPrefix: route.addressPrefix,
              nextHopType: route.nextHopType,
              nextHopIpAddress: route.nextHopIpAddress
            })),
            tags: rt.tags
          });
        }
      }
      
      return networks;
    } catch (error) {
      console.error('Error al escanear redes virtuales:', error);
      return { virtualNetworks: [], subnets: [], securityGroups: [], routeTables: [] };
    }
  }

  async scanStorageAccounts() {
    try {
      const storageAccounts = [];
      const resourceGroups = await this.scanResourceGroups();
      
      for (const group of resourceGroups) {
        const accounts = await this.clients.storage.storageAccounts.listByResourceGroup(group.name);
        
        for await (const account of accounts) {
          // Obtener detalles de contenedores y fileshares
          let containers = [];
          let fileShares = [];
          
          try {
            const keys = await this.clients.storage.storageAccounts.listKeys(group.name, account.name);
            // Aquí se podrían listar los contenedores y file shares utilizando @azure/storage-blob y @azure/storage-file-share
            // Por simplicidad del MVP, omitimos esta parte que requeriría clientes adicionales
          } catch (err) {
            console.warn(`No se pudieron obtener las claves para la cuenta de almacenamiento ${account.name}:`, err.message);
          }
          
          storageAccounts.push({
            id: account.id,
            name: account.name,
            resourceGroup: group.name,
            location: account.location,
            kind: account.kind,
            sku: account.sku?.name,
            accessTier: account.accessTier,
            enableHttpsTrafficOnly: account.enableHttpsTrafficOnly,
            networkRuleSet: account.networkRuleSet,
            containers,
            fileShares,
            tags: account.tags
          });
        }
      }
      
      return storageAccounts;
    } catch (error) {
      console.error('Error al escanear cuentas de almacenamiento:', error);
      return [];
    }
  }

  async scanSqlServers() {
    try {
      const sqlResources = {
        servers: [],
        databases: []
      };
      
      const resourceGroups = await this.scanResourceGroups();
      
      for (const group of resourceGroups) {
        // Obtener servidores SQL
        const servers = await this.clients.sql.servers.listByResourceGroup(group.name);
        
        for await (const server of servers) {
          sqlResources.servers.push({
            id: server.id,
            name: server.name,
            resourceGroup: group.name,
            location: server.location,
            fullyQualifiedDomainName: server.fullyQualifiedDomainName,
            version: server.version,
            administratorLogin: server.administratorLogin,
            tags: server.tags
          });
          
          // Obtener bases de datos para este servidor
          const databases = await this.clients.sql.databases.listByServer(group.name, server.name);
          
          for await (const database of databases) {
            sqlResources.databases.push({
              id: database.id,
              name: database.name,
              serverId: server.id,
              serverName: server.name,
              resourceGroup: group.name,
              location: database.location,
              edition: database.edition,
              collation: database.collation,
              creationDate: database.creationDate,
              maxSizeBytes: database.maxSizeBytes,
              status: database.status,
              tags: database.tags
            });
          }
        }
      }
      
      return sqlResources;
    } catch (error) {
      console.error('Error al escanear recursos SQL:', error);
      return { servers: [], databases: [] };
    }
  }
}

module.exports = AzureConnector;
