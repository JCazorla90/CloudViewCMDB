import React from 'react';
import ConnectionForm from '../components/ConnectionForm';
import ConnectionTable from '../components/ConnectionTable';

export default function AdminPanel() {
  const reload = () => window.location.reload();

  const runDiscovery = async () => {
    if (!window.confirm('¿Deseas lanzar el autodiscovery para todas las conexiones?')) return;
    try {
      const res = await fetch('http://localhost:3000/api/discover/all', {
        method: 'POST'
      });
      if (res.ok) {
        alert('✅ Autodiscovery completado con éxito');
        reload();
      } else {
        alert('❌ Error durante autodiscovery');
      }
    } catch (err) {
      alert('❌ Error de red: ' + err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Panel de Administración</h1>
      <div className="flex justify-between mb-4">
        <ConnectionForm onSuccess={reload} />
        <button onClick={runDiscovery} className="bg-purple-600 text-white px-4 py-2 rounded h-fit">
          🔍 Descubrir Recursos
        </button>
      </div>
      <ConnectionTable />
    </div>
  );
}