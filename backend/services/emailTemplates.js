/**
 * services/emailTemplates.js
 */

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

  const itemsHtml = items.map((i) => {
    const img = i.itemSnapshot.images?.length > 0
      ? i.itemSnapshot.images[0].startsWith("http")
        ? i.itemSnapshot.images[0]
        : `http://localhost:3000/${i.itemSnapshot.images[0]}`
      : "https://via.placeholder.com/70x70?text=No+Image";
    const lineTotal = (i.price * i.quantity).toFixed(2);
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${borderCol};">
          <table width="100%" cellspacing="0" cellpadding="0"><tr>
            <td width="72" valign="top">
              <img src="${img}" style="width:64px;height:64px;border-radius:10px;object-fit:cover;display:block;" />
            </td>
            <td style="padding-left:14px;" valign="top">
              <div style="font-size:14px;font-weight:600;color:${textDark};margin-bottom:4px;">${i.itemSnapshot.title}</div>
              <div style="font-size:13px;color:${textGray};">$${Number(i.price).toFixed(2)} &times; ${i.quantity}</div>
            </td>
            <td align="right" valign="top" style="white-space:nowrap;">
              <div style="font-size:14px;font-weight:700;color:${textDark};">$${lineTotal}</div>
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
        <td align="right" style="font-size:24px;font-weight:800;color:${brand};">$${Number(totalPrice).toFixed(2)}</td>
      </tr>
    </table>
    ${isOnline ? `
    <div style="margin-top:14px;padding:10px 14px;background:#fff3e0;border-radius:8px;font-size:13px;color:#b7640a;border-left:3px solid #f0c07a;line-height:1.5;">
      <strong>Action required:</strong> Please complete your payment to confirm this order.
    </div>` : ""}
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