const { generateQR, validateQR } = require('../controllers/qr.controller');

const router = require('express').Router();


router.post('/generate', generateQR);

router.get('/validate/:id', validateQR);

module.exports = router;