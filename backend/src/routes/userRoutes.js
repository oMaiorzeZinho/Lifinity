const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');
const { uploadAvatar, uploadCover, handleUploadErrors } = require('../middlewares/uploadMiddleware');

router.get('/ranking', verifyToken, userController.getRanking);
router.get('/search', verifyToken, userController.searchUsers);
router.put('/me/password', verifyToken, userController.updatePassword);
router.put('/me/username', verifyToken, userController.updateUsername);
// Upload de imagens: o handleUploadErrors converte erros do multer (tamanho/formato) em JSON
router.put('/me/bio', verifyToken, userController.updateBio);
router.put('/me/avatar', verifyToken, handleUploadErrors(uploadAvatar.single('image')), userController.updateAvatar);
router.put('/me/cover', verifyToken, handleUploadErrors(uploadCover.single('image')), userController.updateCover);
router.delete('/me', verifyToken, userController.deleteAccount);
router.get('/:iduser/public-profile', verifyToken, userController.getPublicProfile);

module.exports = router;
