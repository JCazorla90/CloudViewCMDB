import React, { useEffect, useState } from 'react';

export default function BlockchainAuditPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulación de logs, puedes conectar a una API real si los extraes desde la cadena
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/auditLogs'); // Reemplazar con la tuya si aplica
        const data = await res.json();
        setLogs(data);
      } catch (e) {
        console.warn('⚠️ No se pudieron cargar logs reales, usando dummy data.');
        setLogs([
          {
            eventType: 'resource_create',
            resourceId: 'i-abc123',
            user: 'system',
            details: '{"name":"EC2","region":"us-east-1"}',
            timestamp: Date.now()
          },
          {
            eventType: 'resource_update',
            resourceId: 'r-xyz987',
            user: 'system',
            details: '{"region":["us-east-1","us-west-2"]}',
            timestamp: Date.now()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">🔐 Auditoría Blockchain</h2>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2 border">Evento</th>
              <th className="p-2 border">Recurso</th>
              <th className="p-2 border">Usuario</th>
              <th className="p-2 border">Detalles</th>
              <th className="p-2 border">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td className="p-2 border">{log.eventType}</td>
                <td className="p-2 border">{log.resourceId}</td>
                <td className="p-2 border">{log.user}</td>
                <td className="p-2 border whitespace-pre-wrap">{JSON.stringify(JSON.parse(log.details), null, 2)}</td>
                <td className="p-2 border">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}