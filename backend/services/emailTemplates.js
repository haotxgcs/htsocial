/**
 * services/emailTemplates.js
 */
// Template email gửi cho USER khi tạo đơn hàng mới (cả online & COD)
exports.orderEmailTemplate = ({
  user,
  sellerName,
  order,
  items,
  totalPrice,
  paymentMethod
}) => {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";
  const isOnline   = paymentMethod === "online";

  const fmt = (v) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const itemsHtml = items.map((i) => {
    const img = i.itemSnapshot.images?.length > 0
      ? i.itemSnapshot.images[0].startsWith("http")
        ? i.itemSnapshot.images[0]
        : `http://localhost:3000/${i.itemSnapshot.images[0]}`
      : "https://via.placeholder.com/70x70?text=No+Image";
    const lineTotal = fmt(i.price * i.quantity);
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${borderCol};">
          <table width="100%" cellspacing="0" cellpadding="0"><tr>
            <td width="72" valign="top">
              <img src="${img}" style="width:64px;height:64px;border-radius:10px;object-fit:cover;display:block;" />
            </td>
            <td style="padding-left:14px;" valign="top">
              <div style="font-size:14px;font-weight:600;color:${textDark};margin-bottom:4px;">${i.itemSnapshot.title}</div>
              <div style="font-size:13px;color:${textGray};">${fmt(i.price)} &times; ${i.quantity}</div>
            </td>
            <td align="right" valign="top" style="white-space:nowrap;">
              <div style="font-size:14px;font-weight:700;color:${textDark};">${lineTotal}</div>
            </td>
          </tr></table>
        </td>
      </tr>`;
  }).join("");

  const payMethodBadge = isOnline
    ? `<span style="background:#fff3e0;color:#e67e22;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #f0c07a;">Online Payment (Stripe)</span>`
    : `<span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #a5d6a7;">Cash on Delivery</span>`;

  const payStatusBadge = order.payment.status === "paid"
    ? `<span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Paid</span>`
    : `<span style="background:#fff8e1;color:#f39c12;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Pending</span>`;

  const orderStatusBadge = `<span style="background:${brandLight};color:${brand};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #ffd0c0;text-transform:uppercase;">${order.status}</span>`;

  const section = (icon, title, body) => `
    <div>
      <div style="padding:16px 28px 12px;border-bottom:1px solid ${borderCol};">
        <span style="font-size:17px;vertical-align:middle;">${icon}</span>
        <span style="font-size:15px;font-weight:700;color:${textDark};vertical-align:middle;margin-left:8px;">${title}</span>
      </div>
      <div style="padding:16px 28px;">${body}</div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:620px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:0.4px;">HT Social Marketplace</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">Order Receipt</div>
  </div>

  <!-- HERO -->
  <div style="padding:30px 28px 22px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:32px;margin-bottom:8px;">${isOnline ? "🎉" : "✅"}</div>
    <h2 style="margin:0 0 10px;font-size:20px;color:${textDark};font-weight:700;">
      ${isOnline ? "Order Created &mdash; Please Complete Payment" : "Your Order is Confirmed!"}
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:${textGray};line-height:1.6;">
      Hi <strong>${user.firstname} ${user.lastname}</strong>, thank you for shopping with us. Here&rsquo;s a summary of your order.
    </p>
    <div style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:8px 20px;font-size:13px;color:${textGray};">
      Order ID:&nbsp;<strong style="color:${textDark};font-family:monospace;font-size:14px;">#${order._id.toString().slice(-6)}</strong>
    </div>
  </div>

  <!-- 1. DELIVERY ADDRESS -->
  ${section("📍", "Delivery Address", `
    <div style="background:${brandLight};border-radius:10px;padding:14px 18px;font-size:14px;color:${textDark};line-height:2;">
      <div style="font-size:15px;font-weight:700;">${order.shippingAddress.fullName}</div>
      <div style="color:${textGray};">&#128222;&nbsp;${order.shippingAddress.phone}</div>
      <div style="color:${textGray};">&#128205;&nbsp;${order.shippingAddress.address}</div>
    </div>
  `)}

  <!-- 2. ORDER SUMMARY -->
  ${section("🛒", "Order Summary", `
    <div style="background:#fafafa;border-radius:10px;border:1px solid ${borderCol};padding:0 16px;">
      <div style="padding:10px 0 8px;font-size:12px;font-weight:600;color:${textGray};text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid ${borderCol};">
        Seller:&nbsp;<span style="color:${textDark};text-transform:none;font-weight:700;">${sellerName}</span>
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">${itemsHtml}</table>
    </div>
  `)}

  <!-- 3. PAYMENT -->
  ${section("💳", "Payment", `
    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;color:${textDark};">
      <tr>
        <td style="padding:7px 0;color:${textGray};">Method</td>
        <td align="right">${payMethodBadge}</td>
      </tr>
      <tr>
        <td style="padding:7px 0;color:${textGray};border-top:1px solid ${borderCol};">Payment Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right">${payStatusBadge}</td>
      </tr>
      <tr>
        <td style="padding:7px 0;color:${textGray};border-top:1px solid ${borderCol};">Order Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right">${orderStatusBadge}</td>
      </tr>
    </table>
  `)}

  <!-- 4. TOTAL -->
  <div style="margin:8px 28px 28px;background:${brandLight};border-radius:12px;padding:18px 22px;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-size:15px;font-weight:600;color:${textDark};">Total Payment</td>
        <td align="right" style="font-size:24px;font-weight:800;color:${brand};">${fmt(totalPrice)}</td>
      </tr>
    </table>
    ${isOnline ? `
    <div style="margin-top:14px;padding:10px 14px;background:#fff3e0;border-radius:8px;font-size:13px;color:#b7640a;border-left:3px solid #f0c07a;line-height:1.5;">
      <strong>Action required:</strong> Please complete your payment to confirm this order.
    </div>` : ""}
  </div>

  <div style="padding:0 28px 28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/orders/${order._id}"
      style="display:inline-block;padding:14px 32px;background:${brand};color:#fff;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">
      View Order Details
    </a>
  </div>

  <!-- FOOTER -->
  <div style="background:#fafafa;border-top:1px solid ${borderCol};padding:18px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:${textGray};">Questions? Contact our support team.</p>
    <p style="margin:0;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} HT Social Marketplace. All rights reserved.</p>
  </div>

</div>
</body>
</html>`;
};

// ─── Template gửi cho ADMIN khi có contact mới ───────────────────
exports.contactAdminTemplate = ({ name, email, subject, message }) => {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:620px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:0.4px;">HT Social</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">New Contact Message</div>
  </div>

  <!-- HERO -->
  <div style="padding:28px 28px 20px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:32px;margin-bottom:8px;">📬</div>
    <h2 style="margin:0 0 8px;font-size:20px;color:${textDark};font-weight:700;">New message from a user</h2>
    <p style="margin:0;font-size:14px;color:${textGray};">Someone has submitted a contact request. Please review and respond.</p>
  </div>

  <!-- SENDER INFO -->
  <div style="padding:20px 28px;border-bottom:1px solid ${borderCol};">
    <div style="font-size:12px;font-weight:700;color:${textGray};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Sender Information</div>
    <div style="background:${brandLight};border-radius:10px;padding:14px 18px;font-size:14px;color:${textDark};line-height:2;">
      <div><span style="color:${textGray};min-width:60px;display:inline-block;">Name:</span> <strong>${name}</strong></div>
      <div><span style="color:${textGray};min-width:60px;display:inline-block;">Email:</span> <strong>${email}</strong></div>
      <div><span style="color:${textGray};min-width:60px;display:inline-block;">Reason:</span> <strong>${subject}</strong></div>
    </div>
  </div>

  <!-- MESSAGE -->
  <div style="padding:20px 28px;border-bottom:1px solid ${borderCol};">
    <div style="font-size:12px;font-weight:700;color:${textGray};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Message</div>
    <div style="background:#fafafa;border-radius:10px;border:1px solid ${borderCol};padding:16px 18px;font-size:14px;color:${textDark};line-height:1.7;white-space:pre-wrap;">${message}</div>
  </div>

  <!-- CTA -->
  <div style="padding:24px 28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/admin?tab=contacts"
      style="display:inline-block;padding:13px 32px;background:${brand};color:#fff;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">
      Go to Admin Panel to Reply
    </a>
  </div>

  <!-- FOOTER -->
  <div style="background:#fafafa;border-top:1px solid ${borderCol};padding:18px 28px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} HT Social. All rights reserved.</p>
  </div>

</div>
</body>
</html>`;
};

// ─── Template gửi cho USER khi admin reply ───────────────────────
exports.contactReplyTemplate = ({ name, subject, originalMessage, adminReply }) => {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:620px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:0.4px;">HT Social</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">Support Response</div>
  </div>

  <!-- HERO -->
  <div style="padding:28px 28px 20px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:32px;margin-bottom:8px;">💬</div>
    <h2 style="margin:0 0 8px;font-size:20px;color:${textDark};font-weight:700;">We've responded to your message</h2>
    <p style="margin:0;font-size:14px;color:${textGray};">Hi <strong>${name}</strong>, our support team has reviewed your request and sent a reply below.</p>
  </div>

  <!-- SUBJECT -->
  <div style="padding:16px 28px;border-bottom:1px solid ${borderCol};">
    <span style="font-size:12px;font-weight:700;color:${textGray};text-transform:uppercase;letter-spacing:0.5px;">Regarding: </span>
    <span style="font-size:13px;font-weight:600;color:${textDark};">${subject}</span>
  </div>

  <!-- ADMIN REPLY -->
  <div style="padding:20px 28px;border-bottom:1px solid ${borderCol};">
    <div style="font-size:12px;font-weight:700;color:${textGray};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Admin Response</div>
    <div style="background:${brandLight};border-radius:10px;border-left:4px solid ${brand};padding:16px 18px;font-size:14px;color:${textDark};line-height:1.7;white-space:pre-wrap;">${adminReply}</div>
  </div>

  <!-- ORIGINAL MESSAGE -->
  <div style="padding:20px 28px;border-bottom:1px solid ${borderCol};">
    <div style="font-size:12px;font-weight:700;color:${textGray};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Your Original Message</div>
    <div style="background:#fafafa;border-radius:10px;border:1px solid ${borderCol};padding:16px 18px;font-size:13px;color:${textGray};line-height:1.7;white-space:pre-wrap;">${originalMessage}</div>
  </div>

  <!-- FOOTER -->
  <div style="background:#fafafa;border-top:1px solid ${borderCol};padding:18px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:${textGray};">If you have further questions, feel free to contact us again.</p>
    <p style="margin:0;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} HT Social. All rights reserved.</p>
  </div>

</div>
</body>
</html>`;
};

const fmtPrice = (v) =>
  "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
// ─── Template email COD Refund Approved ─────────────────────────
exports.sendCODRefundEmailTemplate = ({ order }) => {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";
 
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
 
  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;">HT Social Marketplace</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">Refund Notice</div>
  </div>
 
  <div style="padding:32px 28px 24px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:40px;margin-bottom:10px;">💵</div>
    <h2 style="margin:0 0 10px;font-size:20px;color:${textDark};font-weight:700;">Refund Approved!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:${textGray};line-height:1.6;">
      Hi <strong>${order.user.firstname} ${order.user.lastname}</strong>,<br/>
      your refund request has been approved by the seller.
    </p>
    <div style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:8px 20px;font-size:13px;color:${textGray};">
      Order ID:&nbsp;<strong style="color:${textDark};font-family:monospace;font-size:14px;">#${order._id.toString().slice(-6)}</strong>
    </div>
  </div>
 
  <div style="padding:24px 28px;border-bottom:1px solid ${borderCol};">
    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:${textGray};">Payment Method</td>
        <td align="right"><span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #a5d6a7;">Cash on Delivery</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Refund Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Approved</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Order Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:${brandLight};color:${brand};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #ffd0c0;text-transform:uppercase;">Refunded</span></td>
      </tr>
    </table>
  </div>
 
  <div style="margin:20px 28px 8px;background:#e8f5e9;border-radius:12px;padding:18px 22px;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-size:15px;font-weight:600;color:${textDark};">Amount to be Refunded</td>
        <td align="right" style="font-size:24px;font-weight:800;color:#27ae60;">${fmtPrice(order.totalPrice)}</td>
      </tr>
    </table>
  </div>
 
  <div style="margin:12px 28px 28px;padding:14px 18px;background:#f0fff4;border-radius:10px;border-left:3px solid #a5d6a7;font-size:13px;color:#2e7d32;line-height:1.6;">
    🕐 The seller will return your cash payment <strong>within 24 hours</strong>.
    Please contact the seller if you have not received it after that time.
  </div>
 
  <div style="padding:0 28px 28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/orders/${order._id}"
      style="display:inline-block;padding:14px 32px;background:${brand};color:#fff;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">
      View Order Details
    </a>
  </div>
 
  <div style="background:#fafafa;border-top:1px solid ${borderCol};padding:18px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:${textGray};">Questions? Contact our support team.</p>
    <p style="margin:0;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} HT Social Marketplace. All rights reserved.</p>
  </div>
 
</div>
</body>
</html>`;
};


// ─── Shared constants ────────────────────────────────────────────────────────
const BRAND      = "#ff5757";
const BRAND_FONT = "'Berkshire Swash', cursive, serif";
const BG_GRAY    = "#f9f9f9";
const TEXT_DARK  = "#333333";
const TEXT_GRAY  = "#555555";
const TEXT_LIGHT = "#999999";
const BORDER_COL = "#eeeeee";
const LOGIN_LINK = process.env.CLIENT_URL
  ? `${process.env.CLIENT_URL}/login`
  : "http://localhost:8080/login";

// ─── Shared layout helpers ───────────────────────────────────────────────────
const authHeader = () => `
  <div style="background-color:${BRAND};padding:30px 20px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:700;font-family:${BRAND_FONT};letter-spacing:1px;">HT Social</h1>
  </div>`;

const authFooter = () => `
  <div style="background-color:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#888;">
    <p style="margin:0;">&copy; ${new Date().getFullYear()} HT Social. All rights reserved.</p>
  </div>`;

const otpBlock = (otp) => `
  <div style="margin:30px 0;text-align:center;">
    <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:5px;color:${BRAND};background-color:#fff0f1;border:2px dashed ${BRAND};padding:15px 40px;border-radius:8px;">
      ${otp}
    </span>
  </div>`;

const loginButton = () => `
  <div style="margin:30px 0;text-align:center;">
    <a href="${LOGIN_LINK}" style="background-color:${BRAND};color:white;padding:12px 24px;text-decoration:none;border-radius:5px;font-weight:bold;">
      Login Now
    </a>
  </div>`;

const securityNotice = (msg) => `
  <div style="border-top:1px solid ${BORDER_COL};margin-top:30px;padding-top:20px;">
    <p style="font-size:13px;color:${TEXT_LIGHT};text-align:center;">${msg}</p>
  </div>`;

const wrap = (body) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Berkshire+Swash&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${BG_GRAY};font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
    ${body}
  </div>
</body>
</html>`;

// ─── 1. Verify Account (Register) ───────────────────────────────────────────
exports.verifyAccountTemplate = ({ firstname, lastname, verificationLink }) =>
  wrap(`
    ${authHeader()}
    <div style="padding:35px;text-align:center;color:${TEXT_DARK};">
      <h2 style="color:${TEXT_DARK};margin-bottom:15px;">Verify Your Account</h2>
      <p style="font-size:15px;color:${TEXT_GRAY};line-height:1.6;">
        Hello <b>${firstname} ${lastname}</b>,<br/>
        Welcome to <b>HT Social</b> — the community for sharing delicious recipes.
      </p>
      <p style="font-size:15px;color:${TEXT_GRAY};">Please click the button below to verify your email address:</p>
      <a href="${verificationLink}" style="display:inline-block;margin-top:20px;padding:14px 28px;background:${BRAND};color:white;font-size:16px;font-weight:bold;border-radius:10px;text-decoration:none;">
        Verify Account
      </a>
      <p style="margin-top:30px;font-size:13px;color:#777;">
        If you did not create this account, you can safely ignore this email.
      </p>
    </div>
    ${authFooter()}
  `);

// ─── 2. Email Change OTP ─────────────────────────────────────────────────────
exports.emailChangeOtpTemplate = ({ firstname, lastname, newEmail, otp }) =>
  wrap(`
    ${authHeader()}
    <div style="padding:40px 30px;color:${TEXT_DARK};">
      <h2 style="margin-top:0;font-size:20px;font-weight:600;">Confirm your email change</h2>
      <p style="font-size:16px;line-height:1.6;color:${TEXT_GRAY};">
        Hello <b>${firstname} ${lastname}</b>,<br/><br/>
        We received a request to change the email address associated with your account to:
        <a href="mailto:${newEmail}" style="color:${BRAND};text-decoration:none;font-weight:bold;">${newEmail}</a>
      </p>
      <p style="font-size:16px;line-height:1.6;color:${TEXT_GRAY};">Please use the verification code below to confirm this change.</p>
      ${otpBlock(otp)}
      <p style="font-size:14px;color:#777;text-align:center;">This code will expire in <b>5 minutes</b>.</p>
      ${securityNotice("If you did not request this change, please ignore this email.")}
    </div>
    ${authFooter()}
  `);

// ─── 3. Email Changed Successfully ──────────────────────────────────────────
exports.emailChangedSuccessTemplate = ({ firstname, lastname, newEmail }) =>
  wrap(`
    ${authHeader()}
    <div style="padding:40px 30px;color:${TEXT_DARK};">
      <div style="text-align:center;margin-bottom:20px;">
        <h2 style="color:${BRAND};margin:0;font-size:24px;">Email Updated</h2>
      </div>
      <p style="font-size:16px;line-height:1.6;color:${TEXT_GRAY};">Hello <b>${firstname} ${lastname}</b>,</p>
      <p style="font-size:16px;line-height:1.6;color:${TEXT_GRAY};">Your <b>HT Social</b> account email has been successfully changed to:</p>
      <div style="margin:25px 0;text-align:center;">
        <span style="display:inline-block;font-size:18px;font-weight:bold;color:${BRAND};background-color:#fff0f1;padding:12px 24px;border-radius:50px;">
          ${newEmail}
        </span>
      </div>
      <p style="font-size:15px;color:${TEXT_GRAY};text-align:center;">
        Please use this email address to
        <a href="${LOGIN_LINK}" style="color:${BRAND};text-decoration:none;font-weight:bold;">log in</a>
        from now on.
      </p>
      ${securityNotice("If you did not make this change, please contact our support team immediately.")}
    </div>
    ${authFooter()}
  `);

// ─── 4. Password Change OTP ──────────────────────────────────────────────────
exports.passwordChangeOtpTemplate = ({ firstname, lastname, otp }) =>
  wrap(`
    ${authHeader()}
    <div style="padding:40px 30px;color:${TEXT_DARK};">
      <h2 style="margin-top:0;font-size:20px;">Request to Change Password</h2>
      <p>Hello <b>${firstname} ${lastname}</b>,</p>
      <p>We received a request to reset or change your password. Please use the code below to proceed:</p>
      ${otpBlock(otp)}
      <p style="font-size:14px;color:#777;text-align:center;">This code expires in <b>5 minutes</b>.</p>
      ${securityNotice("<strong>Security Notice:</strong> If you did not request this, someone may be trying to access your account. Do not share this code.")}
    </div>
    ${authFooter()}
  `);

// ─── 5. Password Changed Successfully ───────────────────────────────────────
exports.passwordChangedSuccessTemplate = ({ firstname }) =>
  wrap(`
    ${authHeader()}
    <div style="padding:40px 30px;color:${TEXT_DARK};">
      <div style="text-align:center;margin-bottom:20px;">
        <h2 style="color:${BRAND};margin:0;font-size:24px;">Password Updated!</h2>
      </div>
      <p>Hello <b>${firstname}</b>,</p>
      <p>Your password has been successfully changed. You can now log in with your new password.</p>
      ${loginButton()}
      ${securityNotice("If you did not make this change, please contact support immediately.")}
    </div>
    ${authFooter()}
  `);

// ─── 6. Password Reset OTP (Forgot Password) ────────────────────────────────
exports.passwordResetOtpTemplate = ({ firstname, lastname, otp }) =>
  wrap(`
    ${authHeader()}
    <div style="padding:40px 30px;color:${TEXT_DARK};">
      <div style="text-align:center;margin-bottom:20px;">
        <h2 style="color:${BRAND};margin:0;font-size:24px;">Password Reset Request</h2>
      </div>
      <p>Hello <b>${firstname} ${lastname}</b>,</p>
      <p>We received a request to reset your password. Please use the code below to proceed:</p>
      ${otpBlock(otp)}
      <p style="font-size:14px;color:#777;text-align:center;">This code expires in <b>5 minutes</b>.</p>
      ${securityNotice("<strong>Security Notice:</strong> If you did not request this, someone may be trying to access your account. Do not share this code.")}
    </div>
    ${authFooter()}
  `);

// ─── 7. Password Reset Successfully ─────────────────────────────────────────
exports.passwordResetSuccessTemplate = ({ firstname, lastname }) =>
  wrap(`
    ${authHeader()}
    <div style="padding:40px 30px;color:${TEXT_DARK};">
      <div style="text-align:center;margin-bottom:20px;">
        <h2 style="color:${BRAND};margin:0;font-size:24px;">Password Reset Successful!</h2>
      </div>
      <p>Hello <b>${firstname} ${lastname}</b>,</p>
      <p>Your password has been successfully reset. You can now log in with your new password.</p>
      ${loginButton()}
      ${securityNotice("If you did not request this reset, please contact support immediately.")}
    </div>
    ${authFooter()}
  `);


// ─── Template: Payment Success (Stripe) ──────────────────────────
exports.orderPaidTemplate = ({ firstname, lastname, orderId, orderLink, totalPrice }) => {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";
  const fmt = (v) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;">HT Social Marketplace</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">Payment Receipt</div>
  </div>
  <div style="padding:32px 28px 24px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:40px;margin-bottom:10px;">✅</div>
    <h2 style="margin:0 0 10px;font-size:20px;color:${textDark};font-weight:700;">Payment Successful!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:${textGray};line-height:1.6;">
      Hi <strong>${firstname} ${lastname}</strong>,<br/>
      your payment has been received and your order is now confirmed.
    </p>
    <div style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:8px 20px;font-size:13px;color:${textGray};">
      Order ID:&nbsp;<strong style="color:${textDark};font-family:monospace;font-size:14px;">#${orderId}</strong>
    </div>
  </div>
  <div style="padding:24px 28px;border-bottom:1px solid ${borderCol};">
    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:${textGray};">Payment Method</td>
        <td align="right"><span style="background:#fff3e0;color:#e67e22;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #f0c07a;">Online Payment (Stripe)</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Payment Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Paid</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Order Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:${brandLight};color:${brand};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #ffd0c0;text-transform:uppercase;">Confirmed</span></td>
      </tr>
    </table>
  </div>
  <div style="margin:20px 28px 24px;background:${brandLight};border-radius:12px;padding:18px 22px;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-size:15px;font-weight:600;color:${textDark};">Total Paid</td>
        <td align="right" style="font-size:24px;font-weight:800;color:${brand};">${fmt(totalPrice)}</td>
      </tr>
    </table>
  </div>
  <div style="padding:0 28px 28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/orders/${orderLink}"
      style="display:inline-block;padding:14px 32px;background:${brand};color:#fff;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">
      View Order Details
    </a>
  </div>
  <div style="background:#fafafa;border-top:1px solid ${borderCol};padding:18px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:${textGray};">Questions? Contact our support team.</p>
    <p style="margin:0;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} HT Social Marketplace. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;
};

// ─── Template: Stripe Refund Success ─────────────────────────────
exports.stripeRefundTemplate = ({ firstname, lastname, orderId, orderLink, totalPrice }) => {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";
  const fmt = (v) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;">HT Social Marketplace</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">Refund Receipt</div>
  </div>
  <div style="padding:32px 28px 24px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:40px;margin-bottom:10px;">💸</div>
    <h2 style="margin:0 0 10px;font-size:20px;color:${textDark};font-weight:700;">Refund Processed!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:${textGray};line-height:1.6;">
      Hi <strong>${firstname} ${lastname}</strong>,<br/>
      your refund has been processed successfully.
    </p>
    <div style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:8px 20px;font-size:13px;color:${textGray};">
      Order ID:&nbsp;<strong style="color:${textDark};font-family:monospace;font-size:14px;">#${orderId}</strong>
    </div>
  </div>
  <div style="padding:24px 28px;border-bottom:1px solid ${borderCol};">
    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:${textGray};">Refund Status</td>
        <td align="right"><span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Refunded</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Order Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:${brandLight};color:${brand};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #ffd0c0;text-transform:uppercase;">Refunded</span></td>
      </tr>
    </table>
  </div>
  <div style="margin:20px 28px 8px;background:#e8f5e9;border-radius:12px;padding:18px 22px;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-size:15px;font-weight:600;color:${textDark};">Amount Refunded</td>
        <td align="right" style="font-size:24px;font-weight:800;color:#27ae60;">${fmt(totalPrice)}</td>
      </tr>
    </table>
  </div>
  <div style="margin:12px 28px 28px;padding:14px 18px;background:#f0fff4;border-radius:10px;border-left:3px solid #a5d6a7;font-size:13px;color:#2e7d32;line-height:1.6;">
    The refunded amount will be returned to your original payment method within <strong>5–7 business days</strong>.
  </div>
  <div style="padding:0 28px 28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/orders/${orderLink}"
      style="display:inline-block;padding:14px 32px;background:${brand};color:#fff;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">
      View Order Details
    </a>
  </div>
  <div style="background:#fafafa;border-top:1px solid ${borderCol};padding:18px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:${textGray};">Questions? Contact our support team.</p>
    <p style="margin:0;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} HT Social Marketplace. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;
};