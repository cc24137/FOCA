require('dotenv').config();
const app = require('./config/express');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API rodando em https://juju.roney.stein.nom.br`);
});
