const { addAttendee, getAttendee } = require('../controllers/attendee.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = require('express').Router();


router.post('/add', auth(), addAttendee);
router.get('/:id', auth(), getAttendee);
// router.get('/all', auth(), getAllAttendees);




module.exports = router;