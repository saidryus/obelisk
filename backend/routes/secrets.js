const express  = require('express');
const router   = express.Router();
const { verifyToken } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const {
  getSecrets, getSecretById, createSecret, updateSecret, deleteSecret, downloadFile
} = require('../controllers/secretController');

router.use(verifyToken);

router.get('/',             getSecrets);
router.get('/:id',          getSecretById);
router.post('/',            upload.single('file'), createSecret);
router.put('/:id',          upload.single('file'), updateSecret);
router.delete('/:id',       deleteSecret);
router.get('/:id/download', downloadFile);

module.exports = router;
