import React, { useState } from 'react';

const instructions = {
  aws: {
    role: \`
1. Ve a IAM > Roles > Create Role
2. Selecciona "Another AWS Account"
3. Usa el External ID: cloudview-cmdb-access
4. Aplica la política de solo lectura proporcionada en la guía.
5. Guarda el ARN del rol generado.

En CloudView:
- Método: Rol
- Role ARN y External ID
\`,
    token: \`
1. Crea un usuario IAM con permisos de solo lectura.
2. Genera un Access Key ID y Secret Access Key.

En CloudView:
- Método: Token
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
\`
  },
  azure: {
    role: \`
1. Crea una App Registration
2. Genera un Client Secret
3. Asigna el rol 'Reader' a la suscripción

En CloudView:
- Método: Rol
- clientId, tenantId, clientSecret, subscriptionId
\`,
    token: \`Actualmente no soportado\`
  },
  gcp: {
    role: \`
1. Crea un Service Account con rol Viewer
2. Crea una clave JSON
3. Opcional: usa Workload Identity Federation

En CloudView:
- Método: Rol
- JSON Key
\`,
    token: \`
1. Igual que 'Rol': utiliza una JSON Key del Service Account

En CloudView:
- Método: Token
- JSON Key
\`
  },
  ibm: {
    role: \`
1. Crea un usuario con rol Viewer
2. Genera una API Key

En CloudView:
- Método: Rol
- API Key
\`,
    token: \`
1. Crea una API Key directamente desde el portal IAM

En CloudView:
- Método: Token
- API Key
\`
  }
};

export default function ConnectionForm({ onSubmit }) {
  const [provider, setProvider] = useState('aws');
  const [accessMode, setAccessMode] = useState('token');

  return (
    <div className="p-4 border rounded bg-white max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-2">Registrar nueva conexión</h2>

      <label className="block mb-1 font-semibold">Proveedor Cloud</label>
      <select value={provider} onChange={e => setProvider(e.target.value)} className="border p-1 rounded mb-2 w-full">
        <option value="aws">AWS</option>
        <option value="azure">Azure</option>
        <option value="gcp">GCP</option>
        <option value="ibm">IBM Cloud</option>
      </select>

      <label className="block mb-1 font-semibold">Tipo de acceso</label>
      <div className="flex gap-4 mb-2">
        <label><input type="radio" name="accessMode" value="token" checked={accessMode === 'token'} onChange={() => setAccessMode('token')} /> Token</label>
        <label><input type="radio" name="accessMode" value="role" checked={accessMode === 'role'} onChange={() => setAccessMode('role')} /> Rol</label>
      </div>

      <div className="bg-gray-100 p-2 text-xs whitespace-pre-wrap border border-gray-300 rounded mb-2">
        {instructions[provider][accessMode]}
      </div>

      <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={() => onSubmit({ provider, accessMode })}>
        Registrar conexión
      </button>
    </div>
  );
}