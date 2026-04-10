/**
 * services/emailService.js
 * ✅ Central Nodemailer Sender
 */

const nodemailer = require("nodemailer");
const { contactAdminTemplate, contactReplyTemplate } = require("./emailTemplates");

// ✅ Create transporter only once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * ✅ Send Email Helper
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log("✅ Email sent to:", to);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};


exports.sendContact = async ({ name, email, subject, message }) => {
  try {
      await transporter.sendMail({
        from: `"HT Social" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `[Contact] ${subject} — from ${name}`,
        html: contactAdminTemplate({ name, email, subject, message }),
      });
    } catch (mailErr) {
      console.error("Failed to send admin email:", mailErr);
      // Không fail request nếu email lỗi
    }
};

exports.sendContactReply = async ({ to, name, subject, originalMessage, adminReply }) => {
  // ← sửa params: thêm subject, originalMessage; đổi contact.x → dùng thẳng params
  try {
    await transporter.sendMail({
      from: `"HT Social Support" <${process.env.EMAIL_USER}>`,
      to,                                          // ← dùng `to` thay vì `contact.email`
      subject: `Re: ${subject} — HT Social Support`,
      html: contactReplyTemplate({ name, subject, originalMessage, adminReply }),
    });
    console.log("✅ Reply email sent to:", to);
  } catch (err) {
    console.error("❌ Failed to send reply email:", err.message);
  }
};


