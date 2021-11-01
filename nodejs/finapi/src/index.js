const { response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require("uuid"); // v4 is for random uuid

const app = express();
app.use(express.json());

const customers = [];

function verifyIfAccountExists(req, res, next) {
  const { cpf } = req.headers;
  const customer = customers.find(c => c.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: 'Account not found' });
  }

  req.customer = customer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf);

  if(customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists" });
  }
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send();
});

//app.use(verifyIfAccountExists);
app.get("/statement", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  
  return response.json(customer.statement);
});

app.get("/statement/date", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00');
  
  const statement = customer.statement.filter(
    s => s.created_at.toDateString() === new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.post("/deposit", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  const { description, amount } = request.body;

  const deposit = {
    description,
    amount,
    type: "credit",
    created_at: new Date()
  };

  customer.statement.push(deposit);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  const { amount } = request.body;

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return response.status(400).json({ error: "Insufficient funds" });
  }

  const withdraw = {
    amount,
    type: "debit",
    created_at: new Date()
  };

  customer.statement.push(withdraw);

  return response.status(201).send();
});

app.put("/account", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(204).send();
});

app.get("/account", verifyIfAccountExists, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  
  customers.splice(customer, 1);

  return response.status(204).send();
});

app.get("/balance", verifyIfAccountExists, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.status(200).json({ balance });
});

app.listen(3333);