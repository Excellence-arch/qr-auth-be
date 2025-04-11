const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const cors = require('cors');
const { default: helmet } = require('helmet');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

const codeSchema = new mongoose.Schema({
  used: { type: Boolean, default: false },
});
const Code = mongoose.model('Code', codeSchema);

app.get('/', (req, res) => {
  res.send('<h1>QR Code Generator</h1>');
});

app.post('/generate', async (req, res) => {
  const newCode = await Code.create({});
  const qrUrl = `${req.protocol}://${req.get('host')}/validate/${newCode._id}`;
  const qrImage = await QRCode.toDataURL(qrUrl);
  res.json({ qrImage });
});

app.get('/validate/:id', async (req, res) => {
  const code = await Code.findById(req.params.id);
  if (!code) return res.send('<h1>Invalid QR Code</h1>');

  if (code.used) return res.send('<h1>QR Code Already Used</h1>');

  code.used = true;
  await code.save();
  res.send('<h1>QR Code Valid! Success 🎉</h1>');
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
