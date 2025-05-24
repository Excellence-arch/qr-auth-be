const router = require('express').Router();

router.use('/auth', require('./routes/auth.route'));
router.use('/qr', require('./routes/qr.route'))

module.exports = router;