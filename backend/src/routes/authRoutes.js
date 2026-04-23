const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definimos que o caminho /register chama a função register do controlador
router.post('/register', authController.register);
router.post('/login', authController.login); // Nova rota!

module.exports = router;
