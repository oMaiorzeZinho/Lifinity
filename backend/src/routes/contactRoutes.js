const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contactController');

// Rota pública (sem verifyToken): a página Contacte-nos é acessível sem login
router.post('/', contactController.sendContactMessage);

module.exports = router;
