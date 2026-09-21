const express = require("express");
const app = express();
const cors = require('cors');

console.log("FRONTEND_URL carregada:", process.env.FRONTEND_URL);

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: 'GET,POST,PUT,PATCH,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const professorRoutes = require('../app/routes/professorRoutes');
const instituicaoRoutes = require('../app/routes/instituicaoRoutes');
const userRoutes = require('../app/routes/userRoutes');
const disciplinaRoutes = require('../app/routes/disciplinaRoutes');
const turmaRoutes = require('../app/routes/turmaRoutes');
const turma_disciplina_professorRoutes = require('../app/routes/turma_disciplina_professorRoutes');
const aulaRoutes = require('../app/routes/aulaRoutes');
const leituraAtencaoRoutes = require('../app/routes/leituraAtencaoRoutes');
const feedbackRoutes = require('../app/routes/feedbackRoutes');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/professor', professorRoutes);
app.use('/instituicao', instituicaoRoutes);
app.use('/users', userRoutes);
app.use('/disciplinas', disciplinaRoutes);
app.use('/turmas', turmaRoutes);
app.use('/turmaRelacao', turma_disciplina_professorRoutes);
app.use('/aula', aulaRoutes);
app.use('/leituraAtencao', leituraAtencaoRoutes);
app.use('/feedback', feedbackRoutes);

module.exports = app;
