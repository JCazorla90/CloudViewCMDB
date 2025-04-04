import React from 'react';
import { Handle } from 'reactflow';

const providerLogo = {
  aws: '/logos/AWS_icons/aws.png',
  azure: '/logos/Azure_icons/azure.png',
  ibm: '/logos/ibm.png'
};

export default function CloudNode({ data }) {
  const { label, type, provider } = data;
  const logo = providerLogo[provider?.toLowerCase()] || '/logos/default.png';

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow p-2 w-40 text-center">
      <img src={logo} alt={provider} className="h-8 mx-auto mb-1" />
      <div className="text-xs font-bold truncate">{label}</div>
      <div className="text-[10px] text-gray-500">{type}</div>
      <Handle type="target" position="top" />
      <Handle type="source" position="bottom" />
    </div>
  );
}