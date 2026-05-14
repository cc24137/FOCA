const express = require("express");
const app = express();
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: 'GET,POST,PUT,DELETE', 
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

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/professor', professorRoutes);
app.use('/instituicao', instituicaoRoutes);
app.use('/users', userRoutes);
app.use('/disciplinas', disciplinaRoutes);
app.use('/turmas', turmaRoutes);
app.use('/turmaRelacao', turma_disciplina_professorRoutes);
app.use('/aula', aulaRoutes);

module.exports = app;
