const { response, request } = require('express');
const express = require('express');

const app = express();

app.use(express.json());

// rotas

app.listen(3333);