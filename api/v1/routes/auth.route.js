const { register, login, getUser, getUserDashboardAnalytics } = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = require('express').Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', auth(), getUser);
router.get('/user/dashboard-analytics', auth(), getUserDashboardAnalytics);

module.exports = router;