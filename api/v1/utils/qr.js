const Code = require('../models/Code.model');
const QRCode = require('qrcode');

exports.generateQRCode = async (id) => {
  const qrUrl = `${process.env.FRONTEND_URL}/verify-qr.html?id=${id}`;
  const qrImage = await QRCode.toDataURL(qrUrl);
  return qrImage;
};

exports.validateQRCode = async (id) => {
  const code = await Code.findById(id);
  if (!code) return {status: 'invalid'}

  if (code.used) return {status: 'used'}

  return {status: 'valid'}
};
