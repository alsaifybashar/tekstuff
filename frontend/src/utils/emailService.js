const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// Create transporter
let transporter;

const initializeEmailService = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // SMTP configuration
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
};

const sendEmail = async (to, subject, html, attachments = []) => {
  if (!transporter) {
    initializeEmailService();
  }

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
    attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

const renderTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    console.error('Template render error:', error);
    throw new Error('Failed to render email template');
  }
};

const sendVerificationEmail = async (email, token, firstName) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = await renderTemplate('verification', {
    firstName,
    verificationUrl,
    fromName: process.env.FROM_NAME
  });

  return sendEmail(email, 'Verify Your Email Address', html);
};

const sendPasswordResetEmail = async (email, token, firstName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const html = await renderTemplate('password-reset', {
    firstName,
    resetUrl,
    fromName: process.env.FROM_NAME
  });

  return sendEmail(email, 'Password Reset Request', html);
};

const sendOrderConfirmationEmail = async (email, order) => {
  const html = await renderTemplate('order-confirmation', {
    order,
    fromName: process.env.FROM_NAME
  });

  return sendEmail(email, `Order Confirmation #${order.orderNumber}`, html);
};

module.exports = {
  sendEmail,
  renderTemplate,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
};