const express = require("express");
const app = express();

const professorRoutes = require('../app/routes/professorRoutes');
const userRoutes = require('../app/routes/userRoutes');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/professor', professorRoutes);
app.use('/users', userRoutes);

module.exports = app;