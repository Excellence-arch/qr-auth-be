const { addEvent } = require('../controllers/event.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = require('express').Router();

router.post('/', auth(), addEvent);


module.exports = router;