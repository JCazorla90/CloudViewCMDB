const ResourceModel = require('../models/resourceModel');
const DiagramModel = require('../models/diagramModel');
const NodeCache = require('node-cache');

const diagramCache = new NodeCache({ stdTTL: 60 }); // Cache 1 min

class VisualizationService {
  async generateDiagram(connectionId, type, filters = {}) {
    try {
      const cacheKey = `${connectionId}-${type}-${JSON.stringify(filters)}`;
      const cached = diagramCache.get(cacheKey);
      if (cached) return cached;

      const diagram = {
        connectionId,
        type,
        filters,
        nodes: [],
        edges: []
      };

      let resources = [];
      let relations = [];

      switch (type) {
        case 'infrastructure':
          resources = await this.getInfrastructureResources(connectionId, filters);
          break;
        case 'network':
          resources = await this.getNetworkResources(connectionId, filters);
          break;
        case 'service':
          resources = await this.getServiceResources(connectionId, filters);
          break;
        case 'users':
          resources = await this.getUserResources(connectionId, filters);
          break;
        default:
          throw new Error(`Tipo de diagrama no soportado: ${type}`);
      }

      relations = await this.getResourceRelations(resources);

      diagram.nodes = this.resourcesToNodes(resources);
      diagram.edges = this.relationsToEdges(relations, diagram.nodes);
      diagram.layout = this.applyAutoLayout(diagram.nodes, diagram.edges, type);

      diagramCache.set(cacheKey, diagram);
      return diagram;
    } catch (error) {
      console.error('Error al generar diagrama:', error);
      throw error;
    }
  }

  async getInfrastructureResources(connectionId, filters) {
    const resourceTypes = [
      'ec2', 'rds', 's3', 'lambda',
      'virtual_machine', 'sql_server', 'sql_database', 'storage_account',
      'virtual_server', 'cloud_database', 'object_storage', 'functions'
    ];

    return ResourceModel.find({
      connectionId,
      type: { $in: resourceTypes },
      ...filters
    }).lean();
  }

  async getNetworkResources(connectionId, filters) {
    const resourceTypes = [
      'vpc', 'subnet', 'security_group', 'load_balancer',
      'virtual_network', 'subnet', 'network_security_group', 'load_balancer',
      'vpc', 'subnet', 'security_group', 'load_balancer'
    ];

    return ResourceModel.find({
      connectionId,
      type: { $in: resourceTypes },
      ...filters
    }).lean();
  }

  async getServiceResources(connectionId, filters) {
    const resourceTypes = [
      'ecs', 'eks', 'cloudwatch',
      'app_service', 'function_app', 'monitor',
      'containers', 'monitoring', 'functions'
    ];

    return ResourceModel.find({
      connectionId,
      type: { $in: resourceTypes },
      ...filters
    }).lean();
  }

  async getUserResources(connectionId, filters) {
    const resourceTypes = [
      'iam_user', 'iam_role',
      'aad_user', 'aad_group',
      'iam_user', 'iam_policy'
    ];

    return ResourceModel.find({
      connectionId,
      type: { $in: resourceTypes },
      ...filters
    }).lean();
  }

  async getResourceRelations(resources) {
    const resourceIds = resources.map(r => r._id);
    return DiagramModel.find({
      $or: [
        { from: { $in: resourceIds } },
        { to: { $in: resourceIds } }
      ]
    }).lean();
  }

  resourcesToNodes(resources) {
    return resources.map(resource => ({
      id: resource._id.toString(),
      label: resource.name || resource.id || resource.type,
      type: resource.type,
      provider: resource.provider,
      metadata: resource.metadata || {}
    }));
  }

  relationsToEdges(relations, nodes) {
    const nodeIds = new Set(nodes.map(n => n.id));
    return relations
      .filter(rel => nodeIds.has(rel.from.toString()) && nodeIds.has(rel.to.toString()))
      .map(rel => ({
        from: rel.from.toString(),
        to: rel.to.toString(),
        type: rel.type || 'connects',
        metadata: rel.metadata || {}
      }));
  }

  applyAutoLayout(nodes, edges, type) {
    return {
      type: 'dagre',
      config: {
        rankdir: type === 'network' ? 'LR' : 'TB',
        nodeSep: 100,
        edgeSep: 50,
        rankSep: 150
      }
    };
  }
}

module.exports = new VisualizationService();
