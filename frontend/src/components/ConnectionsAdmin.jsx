
import React, { useState, useEffect } from 'react';

export default function ConnectionsAdmin({ onUpdated }) {
  const [connections, setConnections] = useState([]);
  const [form, setForm] = useState({ name: '', provider: '', credentials: '{}' });
  const [editingId, setEditingId] = useState(null);

  const fetchConnections = async () => {
    const res = await fetch('http://localhost:3000/api/connections', {
      headers: { 'x-api-key': 'mi_clave_secreta_super_segura' }
    });
    const data = await res.json();
    setConnections(data);
    if (onUpdated) onUpdated();
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? \`http://localhost:3000/api/connections/\${editingId}\`
      : 'http://localhost:3000/api/connections';

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'mi_clave_secreta_super_segura'
      },
      body: JSON.stringify({
        name: form.name,
        provider: form.provider,
        credentials: JSON.parse(form.credentials || '{}')
      })
    });

    setForm({ name: '', provider: '', credentials: '{}' });
    setEditingId(null);
    fetchConnections();
  };

  const handleEdit = (conn) => {
    setEditingId(conn._id);
    setForm({
      name: conn.name,
      provider: conn.provider,
      credentials: JSON.stringify(conn.credentials, null, 2)
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar conexión?')) return;
    await fetch(\`http://localhost:3000/api/connections/\${id}\`, {
      method: 'DELETE',
      headers: { 'x-api-key': 'mi_clave_secreta_super_segura' }
    });
    fetchConnections();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Nombre"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
          className="border p-2 rounded"
        />
        <select
          value={form.provider}
          onChange={e => setForm({ ...form, provider: e.target.value })}
          required
          className="border p-2 rounded"
        >
          <option value="">Proveedor</option>
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="ibm">IBM Cloud</option>
        </select>
        <textarea
          value={form.credentials}
          onChange={e => setForm({ ...form, credentials: e.target.value })}
          rows="3"
          placeholder="{ }"
          className="col-span-full border p-2 rounded font-mono"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded col-span-full w-max">
          {editingId ? 'Actualizar' : 'Crear conexión'}
        </button>
      </form>

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Proveedor</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {connections.map(conn => (
            <tr key={conn._id}>
              <td className="p-2 border">{conn.name}</td>
              <td className="p-2 border">{conn.provider}</td>
              <td className="p-2 border flex gap-2">
                <button
                  onClick={() => handleEdit(conn)}
                  className="bg-yellow-400 px-2 py-1 text-xs rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(conn._id)}
                  className="bg-red-500 text-white px-2 py-1 text-xs rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
