const express = require('express');
const router = express.Router();

// Importa il controller degli utenti
const usersController = require('../controllers/users.js');

// GET /users
router.get('/', (req, res) => {
  res.send('Router per la gestione degli utenti');
});

// POST /users/register
router.post('/register', usersController.register);

// POST /users/login
router.post('/login', usersController.login);

// POST /users/userById
router.post('/userById', usersController.userById);

// POST /users/logOrQuit
router.post('/logOrQuit', usersController.logOrQuit);

module.exports = router;