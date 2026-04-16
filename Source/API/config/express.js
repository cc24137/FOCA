const express = require("express");
const app = express();

const cors = require('cors');

/*
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: 'GET,POST,PUT,DELETE', 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));
*/
app.use(cors()) // change this for the commented code afterwards

const professorRoutes = require('../app/routes/professorRoutes');
const userRoutes = require('../app/routes/userRoutes');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/professor', professorRoutes);
app.use('/users', userRoutes);

module.exports = app;