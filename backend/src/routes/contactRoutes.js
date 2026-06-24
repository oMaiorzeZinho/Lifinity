const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contactController');
const {
    uploadContactAttachments,
    handleUploadErrors,
    MAX_CONTACT_FILES
} = require('../middlewares/uploadMiddleware');

// Rota pública (sem verifyToken): a página Contacte-nos é acessível sem login.
// O upload corre ANTES do controller para que os anexos cheguem em req.files
// (multipart/form-data). Continua pública — o upload não exige autenticação.
router.post(
    '/',
    handleUploadErrors(uploadContactAttachments.array('attachments', MAX_CONTACT_FILES)),
    contactController.sendContactMessage
);

module.exports = router;
