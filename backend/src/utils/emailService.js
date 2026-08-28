const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Helper to HTML-encode variables for XSS protection in emails
const escapeHtml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Helper to write simulated email logs
const logSimulatedEmail = (to, subject, html, attachments) => {
  const basePath = path.resolve(__dirname, '../..');
  const logFile = path.normalize(path.join(basePath, 'temp_sent_emails.log'));
  
  if (!logFile.startsWith(basePath)) {
    console.error('Invalid path constructed for simulated email logs.');
    return;
  }

  const timestamp = new Date().toISOString();
  const separator = '\n' + '='.repeat(80) + '\n';
  const attachmentInfo = attachments && attachments.length > 0 
    ? `ATTACHMENTS: ${attachments.map(a => `${a.filename} (${a.contentType})`).join(', ')}\n` 
    : '';
  const entry = `${separator}[${timestamp}]\nTO: ${to}\nSUBJECT: ${subject}\n${attachmentInfo}\nBODY (HTML Preview):\n${html}\n${separator}`;
  
  try {
    fs.appendFileSync(logFile, entry);
    console.log(`[SIMULATED EMAIL SENT] TO: ${to} | SUBJECT: ${subject} (Logged to: backend/temp_sent_emails.log)`);
  } catch (err) {
    console.error('Failed to log simulated email:', err.message);
  }
};

// Create Transporter
const getTransporter = () => {
  const rawHost = process.env.SMTP_HOST;
  const rawPort = process.env.SMTP_PORT;
  const rawUser = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;

  if (!rawHost || !rawPort || !rawUser || !rawPass) {
    return null;
  }

  // Clean values by removing surrounding or accidental quotes and trimming whitespace
  const host = rawHost.replace(/['"]/g, '').trim();
  const port = Number(String(rawPort).replace(/['"]/g, '').trim());
  const user = rawUser.replace(/['"]/g, '').trim();
  const pass = rawPass.replace(/['"]/g, '').trim();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for port 465 (SSL), false for other ports (e.g. 587 STARTTLS)
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000, // 10 seconds connection timeout
    socketTimeout: 10000,     // 10 seconds socket timeout
    greetingTimeout: 10000    // 10 seconds greeting timeout
  });
};

const sendEmail = async (options) => {
  const from = process.env.EMAIL_FROM || 'thedentalavenue.lk@gmail.com';

  // 1. Check for Resend API Key (Runs over HTTPS port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendAttachments = options.attachments ? options.attachments.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
        contentType: att.contentType
      })) : [];

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          attachments: resendAttachments
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || `Resend API returned status ${response.status}`);
      }

      console.log(`[EMAIL SENT VIA RESEND] Message ID: ${resData.id}`);
      return { messageId: resData.id, provider: 'resend' };
    } catch (error) {
      console.error('Failed to send email via Resend, falling back to SMTP:', error.message);
    }
  }

  // 2. Check for SendGrid API Key (Runs over HTTPS port 443)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sendgridAttachments = options.attachments ? options.attachments.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
        type: att.contentType,
        disposition: 'attachment'
      })) : [];

      // Extract raw email from format like: "The Dental Avenue" <thedentalavenue.lk@gmail.com>
      let fromEmail = from;
      const match = from.match(/<([^>]+)>/);
      if (match) {
        fromEmail = match[1];
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: fromEmail },
          subject: options.subject,
          content: [{ type: 'text/html', value: options.html }],
          attachments: sendgridAttachments.length > 0 ? sendgridAttachments : undefined
        })
      });

      if (!response.ok) {
        const resText = await response.text();
        throw new Error(`SendGrid API returned status ${response.status}: ${resText}`);
      }

      console.log(`[EMAIL SENT VIA SENDGRID] to: ${options.to}`);
      return { messageId: 'sendgrid-success', provider: 'sendgrid' };
    } catch (error) {
      console.error('Failed to send email via SendGrid, falling back to SMTP:', error.message);
    }
  }

  // 3. Fallback to standard Nodemailer SMTP
  const transporter = getTransporter();

  if (!transporter) {
    // Fallback to simulation
    logSimulatedEmail(options.to, options.subject, options.html, options.attachments);
    return { simulated: true };
  }

  const mailOptions = {
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments || []
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[EMAIL SENT VIA SMTP] Message ID: ${info.messageId}`);
  return info;
};

// Premium Styles
const emailHeader = `
  <div style="background-color: #0ea5e9; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-family: 'Outfit', 'Inter', Helvetica, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">🦷 The Dental Avenue</h1>
  </div>
`;

const emailFooter = `
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; font-family: 'Inter', Helvetica, sans-serif; font-size: 12px; color: #64748b;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">The Dental Avenue Clinic</p>
    <p style="margin: 0 0 15px 0;"># 54, Jaffna Road (New Bus Stand), Vavuniya, Sri Lanka | Emergency Hot: +94 24 222 3637</p>
    <div style="margin-bottom: 15px;">
      <a href="#" style="color: #0ea5e9; text-decoration: none; margin: 0 8px;">Website</a> | 
      <a href="#" style="color: #0ea5e9; text-decoration: none; margin: 0 8px;">Patient Portal</a> | 
      <a href="#" style="color: #0ea5e9; text-decoration: none; margin: 0 8px;">Contact Support</a>
    </div>
    <p style="margin: 0; font-size: 11px;">This is an automated security or informational email. Please do not reply directly to this message.</p>
  </div>
`;

const wrapTemplate = (contentHtml) => `
  <div style="background-color: #f1f5f9; padding: 30px 15px; font-family: 'Inter', Helvetica, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); overflow: hidden;">
      ${emailHeader}
      <div style="padding: 30px; line-height: 1.6; color: #334155; font-size: 15px;">
        ${contentHtml}
      </div>
      ${emailFooter}
    </div>
  </div>
`;

// Templates
const sendVerificationEmail = async (email, name, url) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-family: 'Outfit', sans-serif;">Verify Your Email Address</h2>
    <p>Dear ${escapeHtml(name)},</p>
    <p>Thank you for registering at <strong>The Dental Avenue</strong>. Please click the button below to verify your email address and activate your account:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(url)}" style="background-color: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 15px; display: inline-block;">Verify Email Address</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">If you cannot click the button above, copy and paste the link below into your web browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #0ea5e9;">${escapeHtml(url)}</p>
    <p>If you did not create this account, please ignore this email.</p>
  `;
  return await sendEmail({
    to: email,
    subject: 'Verify Your Email - The Dental Avenue',
    html: wrapTemplate(content)
  });
};

const sendVerificationCodeEmail = async (email, name, code) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-family: 'Outfit', sans-serif;">Verify Your Sign-Up</h2>
    <p>Dear ${escapeHtml(name)},</p>
    <p>Thank you for signing up at <strong>The Dental Avenue</strong>. Please use the following verification code to complete your registration:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="background-color: #f1f5f9; border: 2px dashed #0ea5e9; color: #0f172a; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 28px; letter-spacing: 5px; display: inline-block; font-family: monospace;">${escapeHtml(code)}</span>
    </div>
    <p style="color: #64748b; font-size: 13px; text-align: center;">This code will expire in 5 minutes.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;
  return await sendEmail({
    to: email,
    subject: `${code} is your verification code - The Dental Avenue`,
    html: wrapTemplate(content)
  });
};

const sendPasswordResetEmail = async (email, name, url) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-family: 'Outfit', sans-serif;">Reset Your Password</h2>
    <p>Hello ${escapeHtml(name)},</p>
    <p>We received a request to reset your password for your account at <strong>The Dental Avenue</strong>. Please click the button below to choose a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(url)}" style="background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">This link will expire in 10 minutes. If you cannot click the button, copy and paste this link:</p>
    <p style="word-break: break-all; font-size: 13px; color: #0ea5e9;">${escapeHtml(url)}</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
  `;
  return await sendEmail({
    to: email,
    subject: 'Reset Password Request - The Dental Avenue',
    html: wrapTemplate(content)
  });
};

const sendAppointmentConfirmation = async (email, name, details) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-family: 'Outfit', sans-serif;">Appointment Confirmed! 🎉</h2>
    <p>Dear ${escapeHtml(name)},</p>
    <p>Your appointment with <strong>The Dental Avenue</strong> has been successfully booked. Here are your booking details:</p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #14b8a6; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #475569; width: 130px;">Booking ID:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(details.id)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #475569;">Doctor:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(details.doctorName)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #475569;">Date:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(details.date)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #475569;">Time Slot:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(details.timeSlot)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #475569;">Treatment:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(details.treatmentType)}</td>
        </tr>
      </table>
    </div>

    <p><strong>Important Information:</strong></p>
    <ul>
      <li>Please arrive 10-15 minutes prior to your appointment time to check-in.</li>
      <li>If you need to reschedule or cancel your appointment, please log in to your patient dashboard at least 24 hours in advance.</li>
    </ul>

    <p>Looking forward to seeing you soon!</p>
  `;
  return await sendEmail({
    to: email,
    subject: `Appointment Confirmed - ${details.date} at ${details.timeSlot}`,
    html: wrapTemplate(content)
  });
};

const sendAppointmentReminder = async (email, name, details) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-family: 'Outfit', sans-serif;">Appointment Reminder 🔔</h2>
    <p>Dear ${escapeHtml(name)},</p>
    <p>This is a friendly reminder that you have an upcoming appointment scheduled tomorrow at <strong>The Dental Avenue</strong>:</p>
    
    <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #075985; width: 130px;">Doctor:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(details.doctorName)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #075985;">Date:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(details.date)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #075985;">Time Slot:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(details.timeSlot)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #075985;">Treatment:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(details.treatmentType)}</td>
        </tr>
      </table>
    </div>

    <p>If you cannot make this appointment, please contact us immediately or login to reschedule so we can accommodate other patients.</p>
  `;
  return await sendEmail({
    to: email,
    subject: `Reminder: Appointment with ${details.doctorName} Tomorrow`,
    html: wrapTemplate(content)
  });
};

const sendAppointmentCancellation = async (email, name, details) => {
  const content = `
    <h2 style="color: #ef4444; margin-top: 0; font-family: 'Outfit', sans-serif;">Appointment Cancelled</h2>
    <p>Dear ${escapeHtml(name)},</p>
    <p>Your appointment booked for <strong>${escapeHtml(details.date)}</strong> at <strong>${escapeHtml(details.timeSlot)}</strong> has been cancelled.</p>
    
    ${details.reason ? `<p><strong>Reason for cancellation:</strong> ${escapeHtml(details.reason)}</p>` : ''}

    <p>If this was done in error or you wish to schedule a new appointment, you can visit the Booking Page on our portal at any time.</p>
    <p>If you have any questions, feel free to contact our support hotline.</p>
  `;
  return await sendEmail({
    to: email,
    subject: `Appointment Cancelled - The Dental Avenue`,
    html: wrapTemplate(content)
  });
};

const sendAppointmentCompleted = async (email, name, details) => {
  const content = `
    <h2 style="color: #0ea5e9; margin-top: 0; font-family: 'Outfit', sans-serif;">Appointment Completed</h2>
    <p>Dear ${escapeHtml(name)},</p>
    <p>Thank you for visiting <strong>The Dental Avenue</strong>. Your appointment with <strong>${escapeHtml(details.doctorName)}</strong> on <strong>${escapeHtml(details.date)}</strong> at <strong>${escapeHtml(details.timeSlot)}</strong> has been marked as completed.</p>
    
    <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #075985; width: 135px;">Treatment:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(details.treatmentType)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #075985;">Payment Method:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(details.paymentMethod || 'N/A')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #075985;">Amount Paid:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">LKR ${escapeHtml(details.paymentAmount !== undefined ? details.paymentAmount.toLocaleString() : '0')}</td>
        </tr>
      </table>
    </div>

    ${details.doctorNotes ? `
    <div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; font-weight: 700; color: #075985; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">🩺 Doctor's Notes & Prescriptions</p>
      <p style="margin: 0; color: #334155; font-size: 14px; white-space: pre-line; line-height: 1.5; font-family: monospace;">${escapeHtml(details.doctorNotes)}</p>
    </div>
    ` : ''}

    ${details.attachment ? `
    <div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; font-weight: 700; color: #075985; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">🖼️ Attached Medical Image / X-Ray</p>
      <p style="margin: 0 0 10px 0; text-align: left; font-size: 12px; color: #64748b;">The medical image has also been attached to this email as a file.</p>
      <img src="${escapeHtml(details.attachment)}" style="max-width: 100%; max-height: 300px; border-radius: 6px; border: 1px solid #e2e8f0; object-fit: contain;" />
    </div>
    ` : ''}

    <p>We hope you had a pleasant experience with our medical team. If you have any follow-up questions or need to schedule another check-up, feel free to visit our booking portal or contact us.</p>
    <p>Wishing you healthy teeth and a beautiful smile!</p>
  `;

  const attachments = [];
  if (details.attachment) {
    const matches = details.attachment.match(/^data:(image\/\w+);base64,(.+)$/);
    if (matches) {
      const contentType = matches[1];
      const base64Data = matches[2];
      const extension = contentType.split('/')[1] || 'png';
      attachments.push({
        filename: `xray_${details.id || 'attachment'}.${extension}`,
        content: Buffer.from(base64Data, 'base64'),
        contentType: contentType
      });
    }
  }

  return await sendEmail({
    to: email,
    subject: `Appointment Completed - The Dental Avenue`,
    html: wrapTemplate(content),
    attachments
  });
};

const sendContactInquiryReceipt = async (email, name, inquiryDetails) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-family: 'Outfit', sans-serif;">Inquiry Received</h2>
    <p>Hello ${escapeHtml(name)},</p>
    <p>Thank you for contacting <strong>The Dental Avenue</strong>. We have received your inquiry and our clinic representatives will get back to you within 24 business hours.</p>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #475569;">Your Inquiry Details:</p>
      <p style="margin: 0 0 5px 0;"><strong>Subject:</strong> ${escapeHtml(inquiryDetails.subject)}</p>
      <p style="margin: 0; color: #64748b;"><em>"${escapeHtml(inquiryDetails.message)}"</em></p>
    </div>
    
    <p>If you have an immediate dental emergency, please call us directly at <strong>+94 24 222 3637</strong> instead of waiting for an email reply.</p>
  `;
  return await sendEmail({
    to: email,
    subject: `We've received your inquiry - The Dental Avenue`,
    html: wrapTemplate(content)
  });
};

const sendContactInquiryAdminNotification = async (adminEmail, inquiryDetails) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0; font-family: 'Outfit', sans-serif;">New Clinic Inquiry 📩</h2>
    <p>A new message has been submitted via the Contact Us page on the website:</p>
    
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #92400e; width: 130px;">Name:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(inquiryDetails.name)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #92400e;">Email:</td>
          <td style="padding: 6px 0; color: #0ea5e9;">${escapeHtml(inquiryDetails.email)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #92400e;">Phone:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(inquiryDetails.phone || 'N/A')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #92400e;">Subject:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${escapeHtml(inquiryDetails.subject)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #92400e; vertical-align: top;">Message:</td>
          <td style="padding: 6px 0; color: #334155;">${escapeHtml(inquiryDetails.message)}</td>
        </tr>
      </table>
    </div>
    
    <p>Please review and reply to this inquiry through the Admin Dashboard inbox.</p>
  `;
  return await sendEmail({
    to: adminEmail,
    subject: `Alert: New Inquiry - ${inquiryDetails.subject}`,
    html: wrapTemplate(content)
  });
};

module.exports = {
  sendVerificationEmail,
  sendVerificationCodeEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentCancellation,
  sendAppointmentCompleted,
  sendContactInquiryReceipt,
  sendContactInquiryAdminNotification
};
