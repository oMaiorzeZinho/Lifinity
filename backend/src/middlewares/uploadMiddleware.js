// Middleware de upload de imagens com multer (avatars e covers)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Formatos de imagem aceites
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Tamanho máximo por ficheiro: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Cria uma configuração multer para uma pasta/prefixo específicos
// (ex.: folder 'avatars' + prefix 'avatar' -> /uploads/avatars/avatar_3_1718020000000.png)
const createUploader = (folder, prefix) => {
    const destination = path.join(__dirname, '..', '..', 'uploads', folder);

    // Garante que a pasta existe (caso o projeto seja clonado de novo)
    fs.mkdirSync(destination, { recursive: true });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, destination),
        filename: (req, file, cb) => {
            // Nome único: prefixo + id do utilizador + timestamp + extensão original
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${prefix}_${req.user.iduser}_${Date.now()}${ext}`);
        }
    });

    return multer({
        storage,
        fileFilter: (req, file, cb) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return cb(new Error('Formato inválido. Usa JPG, PNG ou WebP.'));
            }
            cb(null, true);
        },
        limits: { fileSize: MAX_FILE_SIZE }
    });
};

exports.uploadAvatar = createUploader('avatars', 'avatar');
exports.uploadCover = createUploader('covers', 'cover');

// Converte os erros do multer (e do fileFilter) em respostas JSON claras.
// Usa-se a envolver o .single('image'): handleUploadErrors(uploadAvatar.single('image'))
exports.handleUploadErrors = (uploadHandler) => (req, res, next) => {
    uploadHandler(req, res, (err) => {
        if (!err) return next();

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'A imagem não pode exceder 2MB.' });
        }

        return res.status(400).json({ message: err.message || 'Erro ao carregar a imagem.' });
    });
};
