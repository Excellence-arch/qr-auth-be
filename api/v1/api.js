const router = require('express').Router();

router.use('/auth', require('./routes/auth.route'));
router.use('/qr', require('./routes/qr.route'));
router.use('/event', require('./routes/event.route'));

module.exports = router;