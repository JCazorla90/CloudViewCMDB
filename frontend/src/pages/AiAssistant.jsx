import React, { useState } from 'react';

export default function AiAssistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('openai');

  const handleAsk = async () => {
    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch('http://localhost:3000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider })
      });
      const data = await res.json();
      setAnswer(data.answer || 'No se recibió respuesta.');
    } catch (err) {
      setAnswer('❌ Error al consultar el asistente.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">🤖 Asistente CMDB</h2>
      <div className="mb-2 flex gap-2">
        <select
          value={provider}
          onChange={e => setProvider(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="openai">OpenAI</option>
          <option value="bedrock">AWS Bedrock</option>
        </select>
        <input
          type="text"
          className="border w-full px-2 py-1 rounded"
          placeholder="Haz una pregunta sobre tu infraestructura..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <button
          onClick={handleAsk}
          disabled={!question}
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
        >
          Preguntar
        </button>
      </div>
      <div className="bg-gray-100 p-3 rounded min-h-[100px] whitespace-pre-wrap">
        {loading ? '⌛ Consultando...' : answer}
      </div>
    </div>
  );
}