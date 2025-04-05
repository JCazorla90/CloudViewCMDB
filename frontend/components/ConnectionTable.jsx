import React, { useEffect, useState } from 'react';

export default function ConnectionTable() {
  const [connections, setConnections] = useState([]);
  const [message, setMessage] = useState('');

  const loadConnections = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/connections');
      const data = await res.json();
      setConnections(data);
    } catch (err) {
      setMessage('❌ Error cargando conexiones');
    }
  };

  const deleteConnection = async (id) => {
    if (!window.confirm('¿Eliminar esta conexión?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/connections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('✅ Conexión eliminada');
        loadConnections();
      } else {
        setMessage('❌ Error al eliminar');
      }
    } catch {
      setMessage('❌ Error de red');
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(connections, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'conexiones_cmdb.json';
    link.click();
  };

  useEffect(() => {
    loadConnections();
  }, []);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">Conexiones registradas</h2>
        <button onClick={exportJSON} className="bg-green-600 text-white px-3 py-1 rounded text-sm">📤 Exportar JSON</button>
      </div>

      {message && <div className="mb-2 text-sm">{message}</div>}

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Proveedor</th>
            <th className="p-2 border">Acceso</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {connections.map(conn => (
            <tr key={conn._id} className="border-t">
              <td className="p-2 border">{conn.provider}</td>
              <td className="p-2 border">{conn.accessMode}</td>
              <td className="p-2 border">
                <button onClick={() => deleteConnection(conn._id)} className="text-red-600">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}