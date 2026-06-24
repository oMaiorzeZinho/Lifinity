// Middleware de upload de imagens com multer (avatars e covers)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

// ───────────────────────────────────────────────────────────────────────────
// Uploader de ANEXOS do formulário de contacto (rota PÚBLICA).
// Não pode depender de req.user (na rota pública não há login), por isso usa um
// nome de ficheiro único baseado em timestamp + sufixo aleatório (não no iduser).
// Aceita imagens e PDF/texto (lista branca), limita o tamanho e o número de ficheiros.
// ───────────────────────────────────────────────────────────────────────────
const ALLOWED_CONTACT_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain'
];

// Tamanho máximo por anexo: 5MB. Máximo de 3 anexos por mensagem.
const MAX_CONTACT_FILE_SIZE = 5 * 1024 * 1024;
const MAX_CONTACT_FILES = 3;

const createContactUploader = () => {
    const destination = path.join(__dirname, '..', '..', 'uploads', 'contact');
    fs.mkdirSync(destination, { recursive: true });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, destination),
        filename: (req, file, cb) => {
            // Nome único SEM req.user: timestamp + sufixo aleatório + extensão original.
            const ext = path.extname(file.originalname).toLowerCase();
            const suffix = crypto.randomBytes(6).toString('hex');
            cb(null, `contact_${Date.now()}_${suffix}${ext}`);
        }
    });

    return multer({
        storage,
        fileFilter: (req, file, cb) => {
            if (!ALLOWED_CONTACT_MIME_TYPES.includes(file.mimetype)) {
                return cb(new Error('Formato inválido. Anexa imagens (JPG, PNG, WebP), PDF ou texto.'));
            }
            cb(null, true);
        },
        limits: { fileSize: MAX_CONTACT_FILE_SIZE, files: MAX_CONTACT_FILES }
    });
};

exports.uploadContactAttachments = createContactUploader();
exports.MAX_CONTACT_FILES = MAX_CONTACT_FILES;

// Converte os erros do multer (e do fileFilter) em respostas JSON claras.
// Usa-se a envolver o handler: handleUploadErrors(uploadAvatar.single('image'))
// ou handleUploadErrors(uploadContactAttachments.array('attachments', 3)).
exports.handleUploadErrors = (uploadHandler) => (req, res, next) => {
    uploadHandler(req, res, (err) => {
        if (!err) return next();

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'O ficheiro é demasiado grande.' });
        }

        // Excesso de ficheiros (ex.: mais do que o máximo permitido no .array).
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ message: 'Demasiados ficheiros anexados.' });
        }

        return res.status(400).json({ message: err.message || 'Erro ao carregar o ficheiro.' });
    });
};
