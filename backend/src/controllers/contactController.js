const ContactMessage = require('../models/ContactMessage');
const Notification = require('../models/Notification');
const { sendContactInquiryReceipt, sendContactInquiryAdminNotification } = require('../utils/emailService');
const { isValidEmail, isValidPhone } = require('../utils/validators');

// @desc    Submit contact inquiry
// @route   POST /api/contact
// @access  Public
exports.submitInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid name'
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid subject'
      });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid message'
      });
    }

    // Save message to MongoDB
    const inquiry = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message
    });

    // Create Notification for admin in DB
    await Notification.create({
      recipient: null, // Broadcast to admins
      title: 'New Contact Inquiry',
      message: `Inquiry from ${name} regarding "${subject}".`,
      type: 'inquiry'
    });

    // Send emails
    const adminEmail = process.env.ADMIN_EMAIL || 'thedentalavenue.lk@gmail.com';
    
    try {
      // 1. Send receipt to the patient/customer
      await sendContactInquiryReceipt(email, name, { subject, message });
      
      // 2. Send notification to admin
      await sendContactInquiryAdminNotification(adminEmail, { name, email, phone, subject, message });
    } catch (emailErr) {
      console.error('Failed to send contact inquiry emails:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been received. We will get back to you shortly!',
      inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
