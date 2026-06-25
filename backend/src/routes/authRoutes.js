const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definimos que o caminho /register chama a função register do controlador
router.post('/register', authController.register);
router.post('/login', authController.login); // Nova rota!

// Recuperação de palavra-passe por código enviado por email (3 passos):
router.post('/forgot-password', authController.forgotPassword);   // pedir o código
router.post('/verify-reset-code', authController.verifyResetCode); // validar o código
router.post('/reset-password', authController.resetPassword);     // definir a nova palavra-passe

module.exports = router;
