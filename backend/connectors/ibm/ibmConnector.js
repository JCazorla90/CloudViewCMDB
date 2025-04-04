const IbmCloudSdk = require('ibm-cloud-sdk-core');
const ResourceControllerV2 = require('ibm-platform-services/resource-controller/v2');
const VpcV1 = require('@ibm-cloud/vpc/v1');
const ResourceManagerV2 = require('ibm-platform-services/resource-manager/v2');
const IamIdentityV1 = require('ibm-platform-services/iam-identity/v1');

class IBMCloudConnector {
  constructor(credentials) {
    this.credentials = credentials;
    this.clients = {};
  }

  async initialize() {
    try {
      // Configurar autenticación para IBM Cloud
      const authenticator = new IbmCloudSdk.IamAuthenticator({
        apikey: this.credentials.apiKey
      });
      
      // Inicializar clientes de IBM Cloud
      this.clients.resourceController = new ResourceControllerV2({
        authenticator: authenticator
      });
      
      this.clients.resourceManager = new ResourceManagerV2({
        authenticator: authenticator
      });
      
      this.clients.iamIdentity = new IamIdentityV1({
        authenticator: authenticator
      });
      
      // Para VPC necesitamos configurar la región
      this.clients.vpc = new VpcV1({
        authenticator: authenticator,
        serviceUrl: this.credentials.vpcServiceUrl || 'https://us-south.iaas.cloud.ibm.com'
      });
      
      console.log('IBM Cloud Connector inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar IBM Cloud Connector:', error);
      throw error;
    }
  }

  async scanResources() {
    const resources = {
      resourceGroups: await this.scanResourceGroups(),
      instances: await this.scanInstances(),
      vpc: await this.scanVPC(),
      users: await this.scanUsers()
    };

    return resources;
  }

  async scanResourceGroups() {
    try {
      const result = await this.clients.resourceManager.listResourceGroups();
      const resourceGroups = result.result.resources.map(group => ({
        id: group.id,
        name: group.name,
        crn: group.crn,
        state: group.state,
        createdAt: group.created_at,
        updatedAt: group.updated_at
      }));
      
      return resourceGroups;
    } catch (error) {
      console.error('Error al escanear grupos de recursos:', error);
      return [];
    }
  }

  async scanInstances() {
    try {
      const result = await this.clients.resourceController.listResourceInstances();
      const instances = result.result.resources.map(instance => ({
        id: instance.id,
        guid: instance.guid,
        crn: instance.crn,
        name: instance.name,
        resourceGroupId: instance.resource_group_id,
        resourceGroupName: instance.resource_group_name,
        region: instance.region_id,
        type: instance.type,
        serviceId: instance.resource_id,
        serviceName: instance.resource_plan_name,
        state: instance.state,
        createdAt: instance.created_at,
        updatedAt: instance.updated_at,
        url: instance.dashboard_url,
        tags: instance.tags
      }));
      
      return instances;
    } catch (error) {
      console.error('Error al escanear instancias:', error);
      return [];
    }
  }

  async scanVPC() {
    try {
      const networks = {
        vpcs: [],
        subnets: [],
        instances: [],
        securityGroups: []
      };
      
      // Obtener VPCs
      const vpcResult = await this.clients.vpc.listVpcs();
      
      for (const vpc of vpcResult.result.vpcs) {
        networks.vpcs.push({
          id: vpc.id,
          name: vpc.name,
          crn: vpc.crn,
          status: vpc.status,
          createdAt: vpc.created_at,
          defaultNetworkAcl: vpc.default_network_acl ? { id: vpc.default_network_acl.id } : null,
          defaultSecurityGroup: vpc.default_security_group ? { id: vpc.default_security_group.id } : null,
          resourceGroup: vpc.resource_group ? { id: vpc.resource_group.id, name: vpc.resource_group.name } : null
        });
        
        // Obtener subredes para este VPC
        try {
          const subnetResult = await this.clients.vpc.listSubnets({
            vpcId: vpc.id
          });
          
          for (const subnet of subnetResult.result.subnets) {
            networks.subnets.push({
              id: subnet.id,
              name: subnet.name,
              vpcId: vpc.id,
              vpcName: vpc.name,
              ipv4CidrBlock: subnet.ipv4_cidr_block,
              zone: subnet.zone ? { name: subnet.zone.name } : null,
              status: subnet.status,
              availableIpv4AddressCount: subnet.available_ipv4_address_count,
              createdAt: subnet.created_at,
              networkAcl: subnet.network_acl ? { id: subnet.network_acl.id, name: subnet.network_acl.name } : null,
              resourceGroup: subnet.resource_group ? { id: subnet.resource_group.id, name: subnet.resource_group.name } : null
            });
          }
        } catch (subnetError) {
          console.error(`Error al escanear subredes para VPC ${vpc.id}:`, subnetError);
        }
        
        // Obtener instancias para este VPC
        try {
          const instanceResult = await this.clients.vpc.listInstances({
            vpcId: vpc.id
          });
          
          for (const instance of instanceResult.result.instances) {
            const networkInterfaces = [];
            
            try {
              const nicResult = await this.clients.vpc.listInstanceNetworkInterfaces({
                instanceId: instance.id
              });
              
              for (const nic of nicResult.result.network_interfaces) {
                networkInterfaces.push({
                  id: nic.id,
                  name: nic.name,
                  subnetId: nic.subnet ? nic.subnet.id : null,
                  ipv4Address: nic.primary_ipv4_address,
                  securityGroups: nic.security_groups ? nic.security_groups.map(sg => ({ id: sg.id, name: sg.name })) : []
                });
              }
            } catch (nicError) {
              console.error(`Error al escanear interfaces de red para instancia ${instance.id}:`, nicError);
            }
            
            networks.instances.push({
              id: instance.id,
              name: instance.name,
              vpcId: vpc.id,
              vpcName: vpc.name,
              profile: instance.profile ? { name: instance.profile.name } : null,
              zone: instance.zone ? { name: instance.zone.name } : null,
              status: instance.status,
              memory: instance.memory,
              cpuCount: instance.vcpu ? instance.vcpu.count : null,
              image: instance.image ? { id: instance.image.id, name: instance.image.name } : null,
              networkInterfaces,
              primaryNetworkInterface: instance.primary_network_interface ? {
                id: instance.primary_network_interface.id,
                name: instance.primary_network_interface.name,
                ipv4Address: instance.primary_network_interface.primary_ipv4_address
              } : null,
              createdAt: instance.created_at,
              resourceGroup: instance.resource_group ? { id: instance.resource_group.id, name: instance.resource_group.name } : null
            });
          }
        } catch (instanceError) {
          console.error(`Error al escanear instancias para VPC ${vpc.id}:`, instanceError);
        }
        
        // Obtener grupos de seguridad para este VPC
        try {
          const sgResult = await this.clients.vpc.listSecurityGroups({
            vpcId: vpc.id
          });
          
          for (const sg of sgResult.result.security_groups) {
            const rules = [];
            
            try {
              const rulesResult = await this.clients.vpc.listSecurityGroupRules({
                securityGroupId: sg.id
              });
              
              for (const rule of rulesResult.result.rules) {
                rules.push({
                  id: rule.id,
                  direction: rule.direction,
                  protocol: rule.protocol,
                  portMin: rule.port_min,
                  portMax: rule.port_max,
                  remoteIpv4: rule.remote ? rule.remote.address : null,
                  remoteCidrBlock: rule.remote ? rule.remote.cidr_block : null
                });
              }
            } catch (rulesError) {
              console.error(`Error al escanear reglas para grupo de seguridad ${sg.id}:`, rulesError);
            }
            
            networks.securityGroups.push({
              id: sg.id,
              name: sg.name,
              vpcId: vpc.id,
              vpcName: vpc.name,
              rules,
              createdAt: sg.created_at,
              resourceGroup: sg.resource_group ? { id: sg.resource_group.id, name: sg.resource_group.name } : null
            });
          }
        } catch (sgError) {
          console.error(`Error al escanear grupos de seguridad para VPC ${vpc.id}:`, sgError);
        }
      }
      
      return networks;
    } catch (error) {
      console.error('Error al escanear VPC:', error);
      return { vpcs: [], subnets: [], instances: [], securityGroups: [] };
    }
  }

  async scanUsers() {
    try {
      const usersResult = await this.clients.iamIdentity.listServiceIds({
        accountId: this.credentials.accountId
      });
      
      const users = usersResult.result.serviceids.map(user => ({
        id: user.id,
        name: user.name,
        description: user.description,
        uniqueId: user.uniqueId,
        crn: user.crn,
        createdAt: user.createdAt,
        modifiedAt: user.modifiedAt
      }));
      
      return users;
    } catch (error) {
      console.error('Error al escanear usuarios:', error);
      return [];
    }
  }
}

module.exports = IBMCloudConnector;