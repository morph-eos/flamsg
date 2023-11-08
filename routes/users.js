const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.js');

// POST /users/register
router.post('/register', usersController.register);

// POST /users/login
router.post('/login', usersController.login);

// POST /users/userById
router.post('/userById', usersController.userById);

// POST /users/logOrQuit
router.post('/logOrQuit', usersController.logOrQuit);

module.exports = router;