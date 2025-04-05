import React from 'react';
import ConnectionForm from '../components/ConnectionForm';
import ConnectionTable from '../components/ConnectionTable';

export default function AdminPanel() {
  const reload = () => window.location.reload();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Panel de Administración</h1>
      <ConnectionForm onSuccess={reload} />
      <ConnectionTable />
    </div>
  );
}