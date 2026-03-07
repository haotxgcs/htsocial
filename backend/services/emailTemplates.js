/**
 * services/emailTemplates.js
 * ✅ Professional Marketplace Email Template
 */

exports.orderEmailTemplate = ({
  user,
  sellerName,
  order,
  items,
  totalPrice,
  paymentMethod
}) => {
  const brandColor = "#ff5757";

  // ✅ Render items with images
  const itemsHtml = items
    .map((i) => {
      const img =
        i.itemSnapshot.images?.length > 0
          ? i.itemSnapshot.images[0].startsWith("http")
            ? i.itemSnapshot.images[0]
            : `http://localhost:3000/${i.itemSnapshot.images[0]}`
          : "https://via.placeholder.com/70";


      return `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px;display:flex;gap:12px;align-items:center;">

            <img src="${img}"
              style="width:65px;height:65px;border-radius:10px;object-fit:cover;" />

            <div>
              <b style="font-size:15px;color:#222;">
                ${i.itemSnapshot.title}
              </b>
              <p style="margin:4px 0;font-size:13px;color:#666;">
                Quantity: ${i.quantity}
              </p>
            </div>

          </td>

          <td align="right" style="padding:12px;font-weight:bold;">
            $${i.price}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">

  <div style="
    max-width:650px;
    margin:40px auto;
    background:#fff;
    border-radius:14px;
    overflow:hidden;
    box-shadow:0 6px 18px rgba(0,0,0,0.12);
  ">

    <!-- ✅ HEADER -->
    <div style="background:${brandColor};padding:22px;text-align:center;color:white;">
      <h1 style="margin:0;">HT Social Marketplace</h1>
    </div>

    <!-- ✅ TITLE -->
    <div style="padding:25px;text-align:center;">
      <h2 style="margin:0;color:#222;">
        ${
          paymentMethod === "online"
            ? "Order Created 🎉 Please Complete Payment"
            : "Order Confirmed ✅"
        }
      </h2>

      <p style="margin-top:10px;color:#555;font-size:14px;">
        Hello <b>${user.firstname}</b>, thank you for shopping with us!
      </p>
    </div>

    <!-- ✅ ORDER INFO BOX -->
    <div style="
      padding:18px 25px;
      background:#fafafa;
      border-top:1px solid #eee;
      border-bottom:1px solid #eee;
    ">
      <p><b>Order ID:</b> ${order._id}</p>
      <p><b>Seller:</b> ${sellerName}</p>

      <p><b>Status:</b>
        <span style="color:${brandColor};font-weight:bold;">
          ${order.status.toUpperCase()}
        </span>
      </p>

      <p><b>Payment Method:</b> ${order.payment.method.toUpperCase()}</p>
      <p><b>Payment Status:</b> ${order.payment.status.toUpperCase()}</p>
    </div>

    <!-- ✅ SHIPPING -->
    <div style="padding:20px 25px;">
      <h3 style="margin-bottom:8px;color:#222;">📦 Shipping Address</h3>

      <div style="
        background:#fff3ee;
        padding:14px;
        border-radius:10px;
        font-size:14px;
      ">
        ${order.shippingAddress.fullName}<br/>
        ${order.shippingAddress.phone}<br/>
        ${order.shippingAddress.address}
      </div>
    </div>

    <!-- ✅ ITEMS -->
    <div style="padding:20px 25px;">
      <h3 style="margin-bottom:10px;color:#222;">🛒 Items Ordered</h3>

      <table width="100%" cellspacing="0" cellpadding="0"
        style="border-collapse:collapse;">
        ${itemsHtml}
      </table>
    </div>

    <!-- ✅ TOTAL -->
    <div style="
      padding:20px 25px;

      text-align:right;
    ">
      <h2 style="margin:0;color:${brandColor};">
        Total: $${totalPrice}
      </h2>
    </div>

    <!-- ✅ FOOTER -->
    <div style="
      padding:15px;
      text-align:center;
      font-size:12px;
      color:#777;
      background:#fafafa;
    ">
      © ${new Date().getFullYear()} HT Social Marketplace. All rights reserved.
    </div>

  </div>

</body>
</html>
`;
};
