
import React, { useEffect, useState } from 'react';
import DiagramView from './DiagramView';
import LabeledSelect from '../components/LabeledSelect';
import ConnectionsAdmin from '../components/ConnectionsAdmin';
import Login from '../pages/Login';
import useAuth from '../hooks/useAuth';

const diagramTypes = ['infrastructure', 'network', 'service', 'users'];

export default function App() {
  const { user, login, logout } = useAuth();
  const [type, setType] = useState('infrastructure');
  const [providerFilter, setProviderFilter] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [availableConnections, setAvailableConnections] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  const filters = {};
  if (providerFilter) filters.provider = providerFilter;

  const fetchConnections = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/connections', {
        headers: {
          'x-api-key': 'mi_clave_secreta_super_segura'
        }
      });
      const data = await res.json();
      setAvailableConnections(data);
      if (data.length > 0) setConnectionId(data[0]._id);
    } catch (err) {
      console.error('Error al cargar conexiones:', err);
    }
  };

  useEffect(() => {
    if (user) fetchConnections();
  }, [user]);

  if (!user) return <Login onLogin={login} />;

  return (
    <div className="p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="bg-white shadow-md p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">CMDB Visual</h2>
          <p className="text-sm text-gray-500">Rol: {user.role}</p>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <LabeledSelect
            label="Conexión"
            value={connectionId}
            onChange={e => setConnectionId(e.target.value)}
            options={availableConnections.map(conn => ({
              value: conn._id,
              label: `${conn.name} (${conn.provider})`
            }))}
          />
          <LabeledSelect
            label="Tipo"
            value={type}
            onChange={e => setType(e.target.value)}
            options={diagramTypes.map(t => ({ value: t, label: t }))}
          />
          <LabeledSelect
            label="Proveedor"
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos los proveedores' },
              { value: 'aws', label: 'AWS' },
              { value: 'azure', label: 'Azure' },
              { value: 'ibm', label: 'IBM Cloud' }
            ]}
          />
          {user.role === 'admin' && (
            <button
              onClick={() => setShowAdmin(prev => !prev)}
              className="bg-gray-700 text-white px-3 py-1.5 rounded-md"
            >
              {showAdmin ? 'Cerrar Admin' : 'Admin Conexiones'}
            </button>
          )}
          <button onClick={logout} className="text-sm text-red-600 underline">Cerrar sesión</button>
        </div>
      </div>

      {showAdmin ? (
        <div className="bg-white p-4 rounded-xl shadow mb-4">
          <ConnectionsAdmin onUpdated={fetchConnections} />
        </div>
      ) : (
        connectionId && (
          <div className="transition-all duration-500 ease-in-out">
            <DiagramView connectionId={connectionId} type={type} filters={filters} />
          </div>
        )
      )}
    </div>
  );
}
