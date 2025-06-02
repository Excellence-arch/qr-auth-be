const QRCode = require('qrcode');
const Code = require('../models/Code.model');

exports.generateQRCode = async (codeId) => {
  try {
    const code = await Code.findById(codeId);
    if (!code) throw new Error('Code not found');

    // Generate two types of URLs
    const publicUrl = `${process.env.FRONTEND_URL}/user.html?id=${code._id}`; // For general scanners
    const adminUrl = `${process.env.FRONTEND_URL}/verify?code=${code._id}`; // For your frontend

    // Generate QR code with public URL
    const qrImage = await QRCode.toDataURL(publicUrl);

    return {
      qrImage,
      publicUrl,
      adminUrl,
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

exports.validateQRCode = async (codeValue, isAdminRequest = false) => {
  try {
    const code = await Code.findOne({ _id: codeValue }).populate(
      'attendee event'
    );
    // console.log(code);
    if (!code) return { status: 'invalid' };

    if (isAdminRequest && !code.used) {
      // Only mark as used if it's an admin request
      code.used = true;
      code.usedAt = new Date();
      await code.save();
      return {
        status: 'valid',
        attendee: code.attendee,
        event: code.event,
      };
    }

    return {
      status: code.used ? 'used' : 'valid',
      attendee: code.attendee,
      event: code.event,
    };
  } catch (error) {
    console.error('Error validating QR code:', error);
    throw error;
  }
};
