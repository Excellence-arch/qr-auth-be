const { generateQR, validateQR, getCodeInfo, validateCode } = require('../controllers/qr.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = require('express').Router();


router.post('/generate', generateQR);

// router.get('/validate/:id', validateQR);

// Public endpoint for general QR code scanning
router.get('/:code', getCodeInfo);

// Admin endpoint for checking in attendees
router.get('/validate/:code', auth(), validateCode);

module.exports = router;