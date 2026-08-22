const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Manually parse .env file if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = val;
        }
      }
    });
  } catch(e) {
    console.error('Failed to parse .env file:', e);
  }
}

let transporterPromise = null;

function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = new Promise(async (resolve, reject) => {
    // If SMTP variables are defined, use them!
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('Using configured SMTP settings:', process.env.SMTP_HOST);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      resolve(transporter);
    } else {
      // Fallback: create ethereal test account
      console.log('No SMTP config found. Bootstrapping Ethereal test mailer...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('--- ETHEREAL SMTP TEST ACCOUNT CREATED ---');
        console.log('User:', testAccount.user);
        console.log('Pass:', testAccount.pass);
        console.log('SMTP Host:', testAccount.smtp.host);
        console.log('SMTP Port:', testAccount.smtp.port);
        console.log('-----------------------------------------');
        
        const transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        
        // Save test account credentials to process env so we don't recreate them every time
        process.env.SMTP_HOST = testAccount.smtp.host;
        process.env.SMTP_PORT = testAccount.smtp.port.toString();
        process.env.SMTP_USER = testAccount.user;
        process.env.SMTP_PASS = testAccount.pass;
        process.env.SMTP_FROM = `"SWEETOS Store" <${testAccount.user}>`;

        resolve(transporter);
      } catch (err) {
        console.error('Failed to create Ethereal SMTP test account:', err);
        reject(err);
      }
    }
  });

  return transporterPromise;
}

async function sendMail({ to, subject, html }) {
  try {
    const transporter = await getTransporter();
    let from = process.env.SMTP_FROM;
    if (!from) {
      if (process.env.SMTP_USER === 'resend' || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('resend'))) {
        from = `"SWEETOS" <onboarding@resend.dev>`;
      } else {
        from = `"SWEETOS Store" <${process.env.SMTP_USER || 'no-reply@sweetos.store'}>`;
      }
    }
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    console.log(`Email sent to ${to}. Message ID: ${info.messageId}`);
    
    // If using ethereal test account, log the URL to preview the email!
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✉️ Preview URL: ${previewUrl}`);
      // Push preview URL to a custom global storage file so client can view it if needed
      try {
        const previewLogPath = path.join(__dirname, '..', 'data', 'email-previews.json');
        let previews = [];
        if (fs.existsSync(previewLogPath)) {
          previews = JSON.parse(fs.readFileSync(previewLogPath, 'utf8') || '[]');
        }
        previews.unshift({
          id: Date.now(),
          to,
          subject,
          previewUrl,
          timestamp: new Date().toISOString()
        });
        fs.writeFileSync(previewLogPath, JSON.stringify(previews.slice(0, 50), null, 2), 'utf8');
      } catch(e) {
        console.error('Failed to save email preview log:', e);
      }
    }
    return info;
  } catch (error) {
    console.error('Nodemailer sendMail failed:', error);
    throw error;
  }
}

module.exports = { sendMail };
