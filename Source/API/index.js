
require('dotenv').config();
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.json({ 
    status: "Online", 
    message: "Node modules e Express funcionando no Monorepo!" 
  });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});