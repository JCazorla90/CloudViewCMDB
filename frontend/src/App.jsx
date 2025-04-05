import React, { useState } from 'react';
import DiagramView from './DiagramView';
import MonitorView from './MonitorView';

const diagramTypes = ['infrastructure', 'network', 'service', 'users', 'monitor'];

export default function App() {
  const [type, setType] = useState('infrastructure');
  const [providerFilter, setProviderFilter] = useState('');

  const filters = {};
  if (providerFilter) filters.provider = providerFilter;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">CloudView CMDB</h1>

      <div className="flex gap-4 mb-4">
        <select onChange={e => setType(e.target.value)} value={type} className="border px-2 py-1 rounded">
          {diagramTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {type !== 'monitor' && (
          <select onChange={e => setProviderFilter(e.target.value)} value={providerFilter} className="border px-2 py-1 rounded">
            <option value="">Todos los proveedores</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="ibm">IBM Cloud</option>
          </select>
        )}
      </div>

      {type === 'monitor' ? (
        <MonitorView />
      ) : (
        <DiagramView connectionId="64fc12a7b2c12e001d3f1ec2" type={type} filters={filters} />
      )}
    </div>
  );
}