import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import CloudNode from '../components/CloudNode';

const nodeTypes = { cloudNode: CloudNode };

export default function DiagramView({ connectionId, type, filters }) {
  const [elements, setElements] = useState([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const fetchDiagram = async () => {
      try {
        const query = new URLSearchParams(filters).toString();
        const url = `http://localhost:3000/api/diagram/${connectionId}/${type}?${query}`;
        const res = await fetch(url);
        const data = await res.json();

        const nodes = data.nodes.map((n, index) => ({
          id: n.id,
          type: 'cloudNode',
          position: { x: 200 * (index % 5), y: 150 * Math.floor(index / 5) },
          data: {
            label: n.label,
            type: n.type,
            provider: n.provider
          }
        }));

        const edges = data.edges.map(e => ({
          id: `${e.from}-${e.to}`,
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
    link.download = `${type}_diagram.png`;
    link.click();
  };

  const exportToJSON = () => {
    const json = JSON.stringify(elements, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_diagram.json`;
    link.click();
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button onClick={exportToImage} className="bg-blue-500 text-white px-3 py-1 rounded">Exportar PNG</button>
        <button onClick={exportToJSON} className="bg-green-500 text-white px-3 py-1 rounded">Exportar JSON</button>
      </div>
      <div style={{ height: '85vh' }}>
        <ReactFlow
          elements={elements}
          nodeTypes={nodeTypes}
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
  );
}
