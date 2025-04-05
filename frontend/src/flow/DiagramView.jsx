import React, { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import CloudNode from '../components/CloudNode';

const nodeTypes = { cloudNode: CloudNode };

export default function DiagramView({ connectionId, type, filters }) {
  const [elements, setElements] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [changeHistory, setChangeHistory] = useState([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const fetchDiagram = async () => {
      try {
        const query = new URLSearchParams(filters).toString();
        const url = \`http://localhost:3000/api/diagram/\${connectionId}/\${type}?\${query}\`;
        const res = await fetch(url);
        const data = await res.json();

        const nodes = data.nodes.map((n, index) => ({
          id: n.id,
          type: 'cloudNode',
          position: { x: 200 * (index % 5), y: 150 * Math.floor(index / 5) },
          data: {
            label: n.label,
            type: n.type,
            provider: n.provider,
            metadata: n.metadata
          }
        }));

        const edges = data.edges.map(e => ({
          id: \`\${e.from}-\${e.to}\`,
          source: e.from,
          target: e.to,
          type: 'default'
        }));

        setElements([...nodes, ...edges]);
        fitView();
      } catch (err) {
        console.error('Error cargando el diagrama:', err);
      }
    };

    fetchDiagram();
  }, [connectionId, type, filters, fitView]);

  const exportToImage = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = \`\${type}_diagram.png\`;
    link.click();
  };

  const exportToJSON = () => {
    const json = JSON.stringify(elements, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`\${type}_diagram.json\`;
    link.click();
  };

  const onNodeClick = async (_, node) => {
    setSelectedNode(node);
    const res = await fetch(\`http://localhost:3002/api/changes/\${node.id}\`);
    const history = await res.json();
    setChangeHistory(history);
  };

  return (
    <div className="flex">
      <div className="w-4/5">
        <div className="flex gap-2 mb-2">
          <button onClick={exportToImage} className="bg-blue-500 text-white px-3 py-1 rounded">Exportar PNG</button>
          <button onClick={exportToJSON} className="bg-green-500 text-white px-3 py-1 rounded">Exportar JSON</button>
        </div>
        <div style={{ height: '85vh' }}>
          <ReactFlow
            elements={elements}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      <div className="w-1/5 p-4 border-l border-gray-300 overflow-y-auto h-[85vh]">
        {selectedNode ? (
          <div>
            <h2 className="text-md font-semibold mb-2">Historial de cambios</h2>
            <p className="text-xs mb-2 text-gray-600">Recurso: <strong>{selectedNode.data.label}</strong></p>
            {changeHistory.length === 0 ? (
              <p className="text-xs text-gray-500">Sin cambios detectados.</p>
            ) : (
              changeHistory.map((log, i) => (
                <div key={i} className="mb-2 text-xs border-b pb-1">
                  <div className="font-bold text-blue-600">[{log.type}]</div>
                  <div className="text-gray-500">{new Date(log.timestamp).toLocaleString()}</div>
                  {Object.entries(log.changes || {}).map(([key, val], idx) => (
                    <div key={idx}>
                      <span className="font-semibold">{key}</span>: <span className="text-red-600">{val[0]}</span> → <span className="text-green-600">{val[1]}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Haz clic en un nodo para ver historial</p>
        )}
      </div>
    </div>
  );
}