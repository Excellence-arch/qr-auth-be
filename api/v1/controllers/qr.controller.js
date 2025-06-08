const Code = require('../models/Code.model');
const QRCode = require('qrcode');

exports.generateQR = async (req, res) => {
  const newCode = await Code.create({});
  const qrUrl = `${process.env.FRONTEND_URL}/verify-qr.html?id=${newCode._id}`;
  const qrImage = await QRCode.toDataURL(qrUrl);
  return res.json({ qrImage });
};

// exports.validateQR = async (req, res) => {
//   const code = await Code.findById(req.params.id);
//   if (!code) return res.send('<h1>Invalid QR Code</h1>');

//   if (code.used) return res.send('<h1>QR Code Already Used</h1>');

//   code.used = true;
//   await code.save();
//   res.send('<h1>QR Code Valid! Success 🎉</h1>');
// };

// exports.validateQR = async (req, res) => {
//   try {
//     const code = await Code.findById(req.params.id);

//     if (!code) {
//       return res.status(404).json({
//         status: false,
//         message: 'QR code not found',
//       });
//     }
//       // return res.redirect(
//       //   `${process.env.FRONTEND_URL}/verification-failure.html?reason=invalid`
//       // );
//     // }

//     if (code.used) {
//       return res.status(400).json({
//         status: false,
//         message: 'QR code already used',
//       });
//       // return res.redirect(
//       //   `${process.env.FRONTEND_URL}/verification-failure.html?reason=used`
//       // );
//     }

//     code.used = true;
//     await code.save();

//     res.status(200).json({
//       status: 'success',
//       message: 'QR code validated successfully',
//     });
//     // res.redirect(`${process.env.FRONTEND_URL}/verification-success.html`);
//   } catch (error) {
//     console.error('Error validating QR:', error);
//     res.status(500).json({
//       status: false,
//       message: 'Internal server error',
//     });
//     // res.redirect(
//     //   `${process.env.FRONTEND_URL}/verification-failure.html?reason=error`
//     // );
//   }
// };





const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');
const { generateQRCode, validateQRCode } = require('../utils/qr');

// Public endpoint for general QR code scanning
exports.getCodeInfo = async (req, res) => {
  try {
    const { code } = req.params;
    const [validation, qrImage ] = await Promise.all([validateQRCode(code), generateQRCode(code)]);
    

    if (validation.status === 'invalid') {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code',
      });
    }

    if (!validation.attendee) {
      return res.status(404).json({
        success: false,
        message: 'No attendee associated with this code',
      });
    }

    // Return attendee profile information
    res.status(200).json({
      success: true,
      data: {
        attendee: {
          id: validation.attendee._id,
          name: validation.attendee.name,
          email: validation.attendee.email,
        },
        event: validation.event
          ? {
              id: validation.event._id,
              name: validation.event.name,
              date: validation.event.startDate,
            }
          : null,
        status: validation.status,
        code: qrImage.qrImage
      },
    });
  } catch (error) {
    console.error('Error getting code info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Admin endpoint for checking in attendees
exports.validateCode = async (req, res) => {
  try {
    const { code } = req.params;
    console.log(code)
    const validation = await validateQRCode(code, true); // Pass true for admin request

    if (validation.status === 'invalid') {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code',
      });
    }

    if (validation.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'This code has already been used',
      });
    }

    if (!validation.attendee) {
      return res.status(404).json({
        success: false,
        message: 'No attendee associated with this code',
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      data: {
        attendee: {
          id: validation.attendee._id,
          name: validation.attendee.name,
          email: validation.attendee.email,
        },
        event: validation.event
          ? {
              id: validation.event._id,
              name: validation.event.name,
            }
          : null,
        checkedInAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error validating code:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};