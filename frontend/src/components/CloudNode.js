import React from 'react';
import { Handle } from 'reactflow';

const providerLogo = {
  aws: '/logos/AWS_icons/aws.png',
  azure: '/logos/Azure_icons/azure.png',
  ibm: '/logos/ibm.png'
};

export default function CloudNode({ data }) {
  const { label, type, provider, metadata, compliance, issues = [] } = data;
  const logo = providerLogo[provider?.toLowerCase()] || '/logos/default.png';

  const borderColor = compliance === false ? 'border-red-500' :
                      compliance === true ? 'border-green-500' : 'border-gray-300';

  const badge = compliance === false
    ? <span className="absolute top-1 right-1 text-xs bg-red-600 text-white px-1 rounded">❌</span>
    : compliance === true
    ? <span className="absolute top-1 right-1 text-xs bg-green-600 text-white px-1 rounded">✔️</span>
    : null;

  return (
    <div className={\`bg-white \${borderColor} border rounded-xl shadow p-2 w-40 text-center group relative\`}>
      {badge}
      <img src={logo} alt={provider} className="h-8 mx-auto mb-1" />
      <div className="text-xs font-bold truncate">{label}</div>
      <div className="text-[10px] text-gray-500">{type}</div>
      <Handle type="target" position="top" />
      <Handle type="source" position="bottom" />

      <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-[10px] rounded px-2 py-1 left-full top-0 ml-2 max-w-xs text-left">
        {Object.entries(metadata || {}).map(([key, val]) => (
          <div key={key}><strong>{key}:</strong> {String(val)}</div>
        ))}
        {compliance === false && (
          <div className="mt-2 text-red-300">
            <strong>Incumple:</strong>
            <ul className="list-disc ml-4">
              {issues.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}