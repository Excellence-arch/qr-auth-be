const Code = require('../models/Code.model');
const QRCode = require('qrcode');

exports.generateQR = async (req, res) => {
  const newCode = await Code.create({});
  const qrUrl = `${process.env.FRONTEND_URL}/verify-qr.html?id=${newCode._id}`;
  const qrImage = await QRCode.toDataURL(qrUrl);
  res.json({ qrImage });
};

// exports.validateQR = async (req, res) => {
//   const code = await Code.findById(req.params.id);
//   if (!code) return res.send('<h1>Invalid QR Code</h1>');

//   if (code.used) return res.send('<h1>QR Code Already Used</h1>');

//   code.used = true;
//   await code.save();
//   res.send('<h1>QR Code Valid! Success 🎉</h1>');
// };

exports.validateQR = async (req, res) => {
  try {
    const code = await Code.findById(req.params.id);

    if (!code) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/verification-failure.html?reason=invalid`
      );
    }

    if (code.used) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/verification-failure.html?reason=used`
      );
    }

    code.used = true;
    await code.save();

    res.redirect(`${process.env.FRONTEND_URL}//verification-success.html`);
  } catch (error) {
    console.error('Error validating QR:', error);
    res.redirect(
      `${process.env.FRONTEND_URL}/verification-failure.html?reason=error`
    );
  }
};
