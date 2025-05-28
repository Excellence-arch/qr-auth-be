const router = require('express').Router();

const mongoose = require('mongoose');
const setupDailyMaintenance = require('./v1/cron/maintenance');

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

router.use('/v1', require('./v1/api'));

setupDailyMaintenance();

module.exports = router;
