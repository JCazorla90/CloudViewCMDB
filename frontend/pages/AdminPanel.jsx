import React from 'react';
import ConnectionForm from './ConnectionForm';

export default function AdminPanel() {
  const handleConnectionSubmit = (data) => {
    console.log('Enviar a backend:', data);
    // TODO: enviar con fetch a /api/connections
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Panel de Administración</h1>
      <ConnectionForm onSubmit={handleConnectionSubmit} />
    </div>
  );
}