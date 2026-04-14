/**
 * services/emailService.js
 * ✅ Central Nodemailer Sender
 */

const nodemailer = require("nodemailer");
const {
  contactAdminTemplate,
  contactReplyTemplate,
  sendCODRefundEmailTemplate,
  verifyAccountTemplate,
  emailChangeOtpTemplate,
  emailChangedSuccessTemplate,
  passwordChangeOtpTemplate,
  passwordChangedSuccessTemplate,
  passwordResetOtpTemplate,
  passwordResetSuccessTemplate,
  orderPaidTemplate,      // ← thêm
  stripeRefundTemplate,
} = require("./emailTemplates");

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
        replyTo: `"${name}" <${email}>`, 
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

exports.sendCODRefundEmail = async (order) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject: "Refund Approved — You Will Receive Cash Within 24 Hours",
      html: sendCODRefundEmailTemplate({ order }),
    });
    console.log("✅ COD refund email sent to:", order.user.email);
  } catch (err) {
    console.error("❌ COD refund email failed:", err.message);
  }
};




// ─── Auth emails ─────────────────────────────────────────────────────────────

/** 1. Gửi link xác thực tài khoản khi đăng ký */
exports.sendVerifyAccount = async ({ to, firstname, lastname, verificationLink }) => {
  try {
    await transporter.sendMail({
      from: `"HT Social" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verify your HT Social Account",
      html: verifyAccountTemplate({ firstname, lastname, verificationLink }),
    });
    console.log("✅ Verify account email sent to:", to);
  } catch (err) {
    console.error("❌ Verify account email failed:", err.message);
  }
};

/** 2. Gửi OTP xác nhận đổi email */
exports.sendEmailChangeOtp = async ({ to, firstname, lastname, newEmail, otp }) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verification Code for Email Change",
      html: emailChangeOtpTemplate({ firstname, lastname, newEmail, otp }),
    });
    console.log("✅ Email change OTP sent to:", to);
  } catch (err) {
    console.error("❌ Email change OTP failed:", err.message);
  }
};

/** 3. Thông báo đổi email thành công */
exports.sendEmailChangedSuccess = async ({ to, firstname, lastname, newEmail }) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Email Changed Successfully",
      html: emailChangedSuccessTemplate({ firstname, lastname, newEmail }),
    });
    console.log("✅ Email changed success sent to:", to);
  } catch (err) {
    console.error("❌ Email changed success failed:", err.message);
  }
};

/** 4. Gửi OTP xác nhận đổi mật khẩu */
exports.sendPasswordChangeOtp = async ({ to, firstname, lastname, otp }) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verification Code for Password Change",
      html: passwordChangeOtpTemplate({ firstname, lastname, otp }),
    });
    console.log("✅ Password change OTP sent to:", to);
  } catch (err) {
    console.error("❌ Password change OTP failed:", err.message);
  }
};

/** 5. Thông báo đổi mật khẩu thành công */
exports.sendPasswordChangedSuccess = async ({ to, firstname }) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Password Changed Successfully",
      html: passwordChangedSuccessTemplate({ firstname }),
    });
    console.log("✅ Password changed success sent to:", to);
  } catch (err) {
    console.error("❌ Password changed success failed:", err.message);
  }
};

/** 6. Gửi OTP reset mật khẩu (forgot password) */
exports.sendPasswordResetOtp = async ({ to, firstname, lastname, otp }) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verification Code for Password Reset",
      html: passwordResetOtpTemplate({ firstname, lastname, otp }),
    });
    console.log("✅ Password reset OTP sent to:", to);
  } catch (err) {
    console.error("❌ Password reset OTP failed:", err.message);
  }
};

/** 7. Thông báo reset mật khẩu thành công */
exports.sendPasswordResetSuccess = async ({ to, firstname, lastname }) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Password Has Been Reset",
      html: passwordResetSuccessTemplate({ firstname, lastname }),
    });
    console.log("✅ Password reset success sent to:", to);
  } catch (err) {
    console.error("❌ Password reset success failed:", err.message);
  }
};

/** 8. Thông báo thanh toán Stripe thành công */
exports.sendOrderPaidEmail = async (order) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject: "Payment Successful — Order Confirmed",
      html: orderPaidTemplate({
        firstname:  order.user.firstname,
        lastname:   order.user.lastname,
        orderId:    order._id.toString().slice(-6),
        orderLink:  order._id.toString(),
        totalPrice: order.totalPrice,
      }),
    });
    console.log("✅ Order paid email sent to:", order.user.email);
  } catch (err) {
    console.error("❌ Order paid email failed:", err.message);
  }
};

/** 9. Thông báo hoàn tiền Stripe thành công */
exports.sendStripeRefundEmail = async (order) => {
  try {
    await transporter.sendMail({
      from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject: "Refund Completed Successfully",
      html: stripeRefundTemplate({
        firstname:  order.user.firstname,
        lastname:   order.user.lastname,
        orderId:    order._id.toString().slice(-6),
        orderLink:  order._id.toString(),
        totalPrice: order.totalPrice,
      }),
    });
    console.log("✅ Stripe refund email sent to:", order.user.email);
  } catch (err) {
    console.error("❌ Stripe refund email failed:", err.message);
  }
};