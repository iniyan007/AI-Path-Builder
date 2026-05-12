const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Development: use Ethereal/Mailtrap
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Enterprise Todo'}" <${process.env.FROM_EMAIL || 'noreply@enterprisetodo.com'}>`,
      to,
      subject,
      text,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email sending failed: ${error.message}`);
    throw error;
  }
};

const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Welcome to Enterprise Todo! 🎉',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px;">✅</div>
            <h1 style="color: #1e293b; font-size: 28px; margin: 0;">Welcome, ${user.name}!</h1>
          </div>
          <p style="color: #64748b; line-height: 1.7; font-size: 16px;">You've successfully joined <strong>Enterprise Todo</strong> — your all-in-one task management solution built for modern teams.</p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #1e293b; margin: 0 0 12px;">Getting started:</h3>
            <ul style="color: #475569; line-height: 2; margin: 0; padding-left: 20px;">
              <li>Create your first workspace</li>
              <li>Invite your team members</li>
              <li>Add tasks to your projects</li>
              <li>Track progress on the Kanban board</li>
            </ul>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">Go to Dashboard →</a>
          </div>
        </div>
      </div>
    `,
  });

const sendPasswordResetEmail = (user, resetUrl) =>
  sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <h1 style="color: #1e293b; font-size: 24px;">Reset Your Password</h1>
          <p style="color: #64748b; line-height: 1.7;">Hi ${user.name}, you requested to reset your password. Click the button below to proceed. This link expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

const sendWorkspaceInviteEmail = (invitee, inviter, workspace, inviteUrl) =>
  sendEmail({
    to: invitee,
    subject: `${inviter.name} invited you to join "${workspace.name}"`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <h1 style="color: #1e293b; font-size: 24px;">You're Invited! 🎉</h1>
          <p style="color: #64748b; line-height: 1.7;"><strong>${inviter.name}</strong> has invited you to collaborate in the <strong>"${workspace.name}"</strong> workspace on Enterprise Todo.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">Accept Invitation</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">This invitation expires in 7 days.</p>
        </div>
      </div>
    `,
  });

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail, sendWorkspaceInviteEmail };
