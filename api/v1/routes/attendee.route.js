const { addAttendee, getAttendee, getUserAttendees, checkInAttendee, deleteAttendee } = require('../controllers/attendee.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = require('express').Router();


router.post('/add', auth(), addAttendee);
router.get('/all',auth(), getUserAttendees)
router.get('/:id', auth(), getAttendee);
router.post('/check-in/:id', auth(), checkInAttendee);
router.delete('/delete/:id', auth(), deleteAttendee);
// router.get('/all', auth(), getAllAttendees);




module.exports = router;