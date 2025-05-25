const { addEvent, getAccountEvents } = require('../controllers/event.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = require('express').Router();

router.post('/', auth(), addEvent);
router.get('/account', auth(), getAccountEvents);
// router.get('/all', getAllEvents);


module.exports = router;