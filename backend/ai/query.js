const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const mongoose = require('mongoose');
require('dotenv').config();

const router = express.Router();
const Resource = mongoose.model('Resource');
const ChangeLog = mongoose.model('ChangeLog');

// OpenAI Setup
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

// Bedrock Setup
const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

router.post('/api/query', async (req, res) => {
  try {
    const { question, provider } = req.body;
    const resources = await Resource.find().lean();
    const changes = await ChangeLog.find().sort({ timestamp: -1 }).limit(10).lean();

    const context = `
Recursos registrados en la CMDB:
${resources.map(r => `- [${r.provider}] ${r.type} (${r.name}) en ${r.region}`).join("\n")}

Últimos cambios registrados:
${changes.map(c => `- ${c.type} sobre ${c.resourceId} @ ${c.timestamp}`).join("\n")}
`;

    const prompt = `
Eres un asistente experto en infraestructura cloud. Basándote en los datos siguientes, responde la pregunta del usuario de forma clara y concisa.

${context}

Pregunta del usuario: ${question}
`;

    if (provider === 'bedrock') {
      const input = {
        modelId: 'anthropic.claude-v2',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
          max_tokens_to_sample: 300,
          temperature: 0.5
        })
      };
      const command = new InvokeModelCommand(input);
      const response = await bedrock.send(command);
      const body = await response.body.transformToString();
      const parsed = JSON.parse(body);
      return res.json({ answer: parsed.completion || 'Respuesta no válida' });
    } else {
      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      });
      return res.json({ answer: response.data.choices[0].message.content });
    }
  } catch (err) {
    console.error('❌ Error en /api/query:', err.message);
    res.status(500).json({ error: 'Error generando respuesta' });
  }
});

module.exports = router;