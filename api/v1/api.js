const router = require('express').Router();

router.use('/auth', require('./routes/auth.route'));
router.use('/qr', require('./routes/qr.route'));
router.use('/event', require('./routes/event.route'));
router.use('/ticket', require('./routes/ticket.route'));
router.use('/attendee', require('./routes/attendee.route'));

module.exports = router;