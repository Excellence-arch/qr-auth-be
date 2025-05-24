const { addAttendee } = require('../controllers/attendee.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = require('express').Router();


router.post('/add', auth(), addAttendee);




module.exports = router;