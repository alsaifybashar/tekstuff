const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.templateCache = new Map();
  }

  createTransporter() {
    // Support multiple email services
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else if (process.env.EMAIL_SERVICE === 'mailgun') {
      return nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USER,
          pass: process.env.MAILGUN_PASSWORD
        }
      });
    } else {
      // Default to SMTP
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false // Only for development
        }
      });
    }
  }

  async loadTemplate(templateName) {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateContent);
      
      // Cache the compiled template
      this.templateCache.set(templateName, compiledTemplate);
      return compiledTemplate;
    } catch (error) {
      console.error(`Failed to load email template ${templateName}:`, error);
      // Return a basic fallback template
      return handlebars.compile(`
        <html>
          <body>
            <h2>{{subject}}</h2>
            <p>{{message}}</p>
            <hr>
            <p><small>This is an automated email from {{fromName}}.</small></p>
          </body>
        </html>
      `);
    }
  }

  async sendEmail({ to, subject, template, data = {}, html, text }) {
    try {
      // Validate input
      if (!to || !subject) {
        throw new Error('Email recipient and subject are required');
      }

      let emailHtml = html;
      
      // If template is specified, compile it with data
      if (template) {
        const compiledTemplate = await this.loadTemplate(template);
        emailHtml = compiledTemplate({
          ...data,
          subject,
          fromName: process.env.FROM_NAME || 'Your Store',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@yourstore.com',
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
        });
      }

      const mailOptions = {
        from: `${process.env.FROM_NAME || 'Your Store'} <${process.env.FROM_EMAIL || 'noreply@yourstore.com'}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: emailHtml,
        text: text || this.stripHtml(emailHtml)
      };

      // In development, just log the email instead of sending
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        console.log('📧 EMAIL (Development Mode):');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('HTML:', emailHtml ? 'Yes' : 'No');
        console.log('Text:', mailOptions.text);
        console.log('---');
        return { messageId: 'dev-mode-' + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}:`, result.messageId);
      return result;

    } catch (error) {
      console.error('Email sending failed:', error);
      // Don't throw error in development - just log it
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 EMAIL FAILED (Development Mode):', error.message);
        return { messageId: 'dev-failed-' + Date.now() };
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Helper method to strip HTML for text version
  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .trim();
  }

  // Verify email service configuration
  async verifyConnection() {
    try {
      // Skip verification in development mode without SMTP
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        console.log('Email service: Development mode (emails will be logged)');
        return true;
      }

      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }

  // Send verification email
  async sendVerificationEmail(email, firstName, verificationToken) {
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Account',
      template: 'verification',
      data: {
        firstName,
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
      }
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email, firstName, resetToken) {
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        firstName,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
        expirationTime: '1 hour'
      }
    });
  }

  // Send welcome email
  async sendWelcomeEmail(email, firstName) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Our Store!',
      template: 'welcome',
      data: {
        firstName,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@yourstore.com'
      }
    });
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(email, orderData) {
    return this.sendEmail({
      to: email,
      subject: `Order Confirmation - #${orderData.orderNumber}`,
      template: 'order-confirmation',
      data: {
        ...orderData,
        trackingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderData.id}`
      }
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export the sendEmail method bound to the instance
module.exports = {
  sendEmail: emailService.sendEmail.bind(emailService),
  sendVerificationEmail: emailService.sendVerificationEmail.bind(emailService),
  sendPasswordResetEmail: emailService.sendPasswordResetEmail.bind(emailService),
  sendWelcomeEmail: emailService.sendWelcomeEmail.bind(emailService),
  sendOrderConfirmationEmail: emailService.sendOrderConfirmationEmail.bind(emailService),
  verifyConnection: emailService.verifyConnection.bind(emailService)
};