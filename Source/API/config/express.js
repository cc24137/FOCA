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

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/professor', professorRoutes);
app.use('/instituicao', instituicaoRoutes);
app.use('/users', userRoutes);
app.use('/disciplinas', disciplinaRoutes);
app.use('/turmas', turmaRoutes);


module.exports = app;