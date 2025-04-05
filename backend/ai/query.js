const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const mongoose = require('mongoose');
require('dotenv').config();

const router = express.Router();

const Resource = mongoose.model('Resource');
const ChangeLog = mongoose.model('ChangeLog');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

router.post('/api/query', async (req, res) => {
  try {
    const question = req.body.question;
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

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    res.json({ answer: response.data.choices[0].message.content });
  } catch (err) {
    console.error("❌ Error al procesar pregunta:", err.message);
    res.status(500).json({ error: "Error generando respuesta" });
  }
});

module.exports = router;