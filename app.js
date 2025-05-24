const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { default: helmet } = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

app.get('/', (req, res) => {
  res.send('<h1>QR Code Generator</h1>');
});

app.use('/api', require('./api/index'));

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
