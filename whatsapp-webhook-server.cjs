const express = require('express');
const app = express();

app.use(express.json());

// Troque pelo mesmo token que você colocou no WhatsApp (ex: "teste")
const VERIFY_TOKEN = 'teste';

// Endpoint para verificação do webhook (GET)
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Endpoint para receber mensagens (POST)
app.post('/api/webhook', (req, res) => {
  console.log('Recebido webhook:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de webhook rodando na porta ${PORT}`);
});