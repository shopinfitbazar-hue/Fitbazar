function renderShell(title: string, intro: string, ctaLabel: string, ctaUrl: string, footerNote: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:20px 24px;background:#ff3f6c;border-radius:12px 12px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Fit Bazar</td>
                  <td align="right" style="font-size:11px;color:rgba(255,255,255,0.75);font-weight:500;">Nepal&#8217;s Fashion Store</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;background:#ffffff;border-left:1px solid #eaeaec;border-right:1px solid #eaeaec;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#282c3f;font-weight:700;">${title}</h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#535766;">${intro}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:#ff3f6c;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 8px;font-size:13px;color:#94969f;">If the button above does not work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#535766;">${ctaUrl}</p>
              <hr style="border:none;border-top:1px solid #eaeaec;margin:24px 0;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#94969f;">${footerNote}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#fafafa;border-radius:0 0 12px 12px;border:1px solid #eaeaec;border-top:none;">
              <p style="margin:0;font-size:12px;color:#94969f;">&copy; ${new Date().getFullYear()} Fit Bazar. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderPasswordResetEmail(name: string, resetUrl: string) {
  return renderShell(
    "Reset your Fit Bazar password",
    `Hello ${name}, we received a request to reset your password. Use the secure button below to set a new one. This link expires in 1 hour.`,
    "Reset Password",
    resetUrl,
    "If you did not request this password reset, you can safely ignore this email. Your account remains secure.",
  );
}

export function renderEmailVerificationEmail(name: string, verificationUrl: string) {
  return renderShell(
    "Verify your Fit Bazar email",
    `Hello ${name}, confirm your email address to activate your Fit Bazar account and start shopping.`,
    "Verify Email",
    verificationUrl,
    "If you did not create this account, you can ignore this email.",
  );
}

export function renderCustomerWelcomeEmail(name: string, shopUrl: string) {
  return renderShell(
    "Welcome to Fit Bazar",
    `Hello ${name}, thank you for creating your Fit Bazar account. We are happy to have you here. Your account is ready for easier shopping, saved addresses, order tracking, wishlists, and bills in one place. Take your time, explore comfortably, and choose what feels right for you.`,
    "Start Exploring",
    shopUrl,
    "We are building Fit Bazar to feel simple, trustworthy, and useful for everyday shopping in Nepal. If you ever need help, our support team is here for you.",
  );
}

export function renderOrderPlacedEmail(name: string, orderNumber: string, orderUrl: string) {
  return renderShell(
    "Your Fit Bazar order is confirmed",
    `Hello ${name}, your order ${orderNumber} has been placed successfully. We will keep you updated as the vendor prepares it.`,
    "View Order",
    orderUrl,
    "Thank you for shopping with Fit Bazar.",
  );
}

type OrderBillEmailItem = {
  name: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  price: number;
  total: number;
};

type OrderBillEmailOrder = {
  orderNumber: string;
  vendorName: string;
  createdAt: Date | string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  items: OrderBillEmailItem[];
};

type OrderBillEmailInput = {
  customerName: string;
  customerEmail?: string;
  deliveryAddress: string;
  billUrl: string;
  orders: OrderBillEmailOrder[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
};

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBillMoney(value: number) {
  return `NPR ${Math.round(value || 0).toLocaleString("en-NP")}`;
}

function formatBillDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function renderBillOrder(order: OrderBillEmailOrder) {
  const rows = order.items
    .map((item) => {
      const variant = [item.size, item.color].filter(Boolean).join(" / ") || "Default";

      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #eaeaec;color:#282c3f;font-size:13px;font-weight:700;">${escapeHtml(item.name)}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #eaeaec;color:#535766;font-size:12px;">${escapeHtml(variant)}</td>
          <td align="center" style="padding:14px 12px;border-bottom:1px solid #eaeaec;color:#282c3f;font-size:13px;font-weight:700;">${item.quantity}</td>
          <td align="right" style="padding:14px 12px;border-bottom:1px solid #eaeaec;color:#535766;font-size:13px;">${formatBillMoney(item.price)}</td>
          <td align="right" style="padding:14px 12px;border-bottom:1px solid #eaeaec;color:#282c3f;font-size:13px;font-weight:800;">${formatBillMoney(item.total)}</td>
        </tr>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #eaeaec;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:18px 18px 8px;background:#ffffff;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:11px;color:#94969f;text-transform:uppercase;letter-spacing:1.2px;font-weight:800;">Official Bill</div>
                <div style="margin-top:5px;font-size:18px;color:#282c3f;font-weight:800;">${escapeHtml(order.orderNumber)}</div>
              </td>
              <td align="right" style="font-size:12px;color:#535766;line-height:1.7;">
                <strong style="color:#282c3f;">${escapeHtml(order.vendorName)}</strong><br>
                ${formatBillDate(order.createdAt)}<br>
                ${escapeHtml(order.paymentMethod)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 18px 18px;background:#ffffff;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th align="left" style="padding:11px 12px;background:#f6f6f7;color:#535766;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Item</th>
                <th align="left" style="padding:11px 12px;background:#f6f6f7;color:#535766;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Variant</th>
                <th align="center" style="padding:11px 12px;background:#f6f6f7;color:#535766;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Qty</th>
                <th align="right" style="padding:11px 12px;background:#f6f6f7;color:#535766;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Rate</th>
                <th align="right" style="padding:11px 12px;background:#f6f6f7;color:#535766;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
            <tr>
              <td width="52%"></td>
              <td style="padding:4px 0;color:#535766;font-size:13px;">Subtotal</td>
              <td align="right" style="padding:4px 0;color:#282c3f;font-size:13px;font-weight:700;">${formatBillMoney(order.subtotal)}</td>
            </tr>
            <tr>
              <td></td>
              <td style="padding:4px 0;color:#535766;font-size:13px;">Shipping</td>
              <td align="right" style="padding:4px 0;color:#282c3f;font-size:13px;font-weight:700;">${formatBillMoney(order.shipping)}</td>
            </tr>
            <tr>
              <td></td>
              <td style="padding:4px 0;color:#535766;font-size:13px;">Discount</td>
              <td align="right" style="padding:4px 0;color:#0b8a4b;font-size:13px;font-weight:700;">- ${formatBillMoney(order.discount)}</td>
            </tr>
            <tr>
              <td></td>
              <td style="padding:4px 0;color:#535766;font-size:13px;">Tax</td>
              <td align="right" style="padding:4px 0;color:#282c3f;font-size:13px;font-weight:700;">${formatBillMoney(order.tax)}</td>
            </tr>
            <tr>
              <td></td>
              <td style="padding:12px 0 0;border-top:1px solid #eaeaec;color:#282c3f;font-size:16px;font-weight:800;">Total</td>
              <td align="right" style="padding:12px 0 0;border-top:1px solid #eaeaec;color:#282c3f;font-size:18px;font-weight:900;">${formatBillMoney(order.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function renderOrderBillEmail(input: OrderBillEmailInput) {
  const orderNumbers = input.orders.map((order) => order.orderNumber).join(", ");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;">
          <tr>
            <td style="padding:22px 24px;background:#ff3f6c;border-radius:14px 14px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Fit Bazar</td>
                  <td align="right" style="font-size:12px;color:rgba(255,255,255,0.82);font-weight:700;">Official Bill</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 24px;background:#ffffff;border-left:1px solid #eaeaec;border-right:1px solid #eaeaec;">
              <h2 style="margin:0 0 10px;font-size:24px;color:#282c3f;font-weight:900;">Thank you for your order</h2>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#535766;">Hello ${escapeHtml(input.customerName || "there")}, your Fit Bazar order has been placed successfully. Your official bill is included below for order number ${escapeHtml(orderNumbers)}.</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#282c3f;font-weight:700;">तपाईंको किनमेलको लागि धन्यवाद। तपाईंलाई शुभ दिनको कामना।</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;border:1px solid #eaeaec;border-radius:12px;background:#fafafa;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-size:11px;color:#94969f;text-transform:uppercase;letter-spacing:1px;font-weight:800;">Bill To</div>
                    <div style="margin-top:6px;font-size:14px;color:#282c3f;font-weight:800;">${escapeHtml(input.customerName || "Customer")}</div>
                    <div style="margin-top:3px;font-size:13px;color:#535766;line-height:1.6;">${escapeHtml(input.customerEmail || "")}<br>${escapeHtml(input.deliveryAddress || "Address unavailable")}</div>
                  </td>
                  <td align="right" style="padding:16px;">
                    <div style="font-size:11px;color:#94969f;text-transform:uppercase;letter-spacing:1px;font-weight:800;">Amount Due</div>
                    <div style="margin-top:6px;font-size:26px;color:#282c3f;font-weight:900;">${formatBillMoney(input.total)}</div>
                    <div style="margin-top:3px;font-size:12px;color:#94969f;">${input.orders.length} vendor bill${input.orders.length === 1 ? "" : "s"}</div>
                  </td>
                </tr>
              </table>

              ${input.orders.map(renderBillOrder).join("")}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border:1px solid #eaeaec;border-radius:12px;background:#fafafa;">
                <tr>
                  <td style="padding:16px;color:#535766;font-size:14px;">Grand Subtotal</td>
                  <td align="right" style="padding:16px;color:#282c3f;font-size:14px;font-weight:800;">${formatBillMoney(input.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:0 16px 16px;color:#535766;font-size:14px;">Shipping</td>
                  <td align="right" style="padding:0 16px 16px;color:#282c3f;font-size:14px;font-weight:800;">${formatBillMoney(input.shipping)}</td>
                </tr>
                <tr>
                  <td style="padding:0 16px 16px;color:#535766;font-size:14px;">Discount</td>
                  <td align="right" style="padding:0 16px 16px;color:#0b8a4b;font-size:14px;font-weight:800;">- ${formatBillMoney(input.discount)}</td>
                </tr>
                <tr>
                  <td style="padding:16px;border-top:1px solid #eaeaec;color:#282c3f;font-size:18px;font-weight:900;">Grand Total</td>
                  <td align="right" style="padding:16px;border-top:1px solid #eaeaec;color:#282c3f;font-size:22px;font-weight:900;">${formatBillMoney(input.total)}</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(input.billUrl)}" style="display:inline-block;padding:14px 28px;background:#ff3f6c;color:#ffffff;text-decoration:none;border-radius:999px;font-size:15px;font-weight:800;">
                      Open / Print Bill
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-size:12px;word-break:break-all;color:#94969f;">${escapeHtml(input.billUrl)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#fafafa;border-radius:0 0 14px 14px;border:1px solid #eaeaec;border-top:none;">
              <p style="margin:0;font-size:12px;color:#94969f;">&copy; ${new Date().getFullYear()} Fit Bazar. Keep this email for your records.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderVendorOrderEmail(shopName: string, orderNumber: string, orderUrl: string) {
  return renderShell(
    "New order received",
    `Hello ${shopName}, order ${orderNumber} is waiting in your vendor dashboard. Please review it and prepare the items on time.`,
    "Open Vendor Orders",
    orderUrl,
    "Timely updates help customers track their order with confidence.",
  );
}

export function renderVendorUpdateEmail(name: string, title: string, message: string, dashboardUrl: string) {
  return renderShell(
    title,
    `Hello ${name}, ${message}`,
    "Open Vendor Dashboard",
    dashboardUrl,
    "This message was sent by Fit Bazar Vendor Support.",
  );
}

export function renderPartnerApplicationEmail(name: string, planLabel: string, amount: string, dashboardUrl: string) {
  return renderShell(
    "Partner application received",
    `Hello ${name}, thank you for applying for the Fit Bazar Partner Shop program. Your selected plan is ${planLabel} with a payable amount of ${amount}. Our team will review the payment and activate your partner benefits after confirmation.`,
    "Open Partner Center",
    dashboardUrl,
    "Partner requests are reviewed by Fit Bazar Admin. Please keep your shop details, products, and contact information updated so the approval process stays smooth.",
  );
}

export function renderPartnerApprovedEmail(name: string, planLabel: string, expiryDate: string, dashboardUrl: string) {
  return renderShell(
    "Congratulations, you are now a Fit Bazar Partner Shop",
    `Hello ${name}, congratulations. Your ${planLabel} is active until ${expiryDate}. Partner shops receive stronger marketplace visibility, eligibility for Top Shop placement, homepage/storefront highlights, priority campaign review, and faster support for product promotions. Keep your product photos, stock, prices, and delivery updates fresh so customers get the best experience from your shop.`,
    "Open Vendor Dashboard",
    dashboardUrl,
    "We are excited to grow with you. Thank you for trusting Fit Bazar as your fashion marketplace partner.",
  );
}

export function renderPartnerStatusEmail(name: string, title: string, message: string, dashboardUrl: string) {
  return renderShell(
    title,
    `Hello ${name}, ${message}`,
    "Open Partner Center",
    dashboardUrl,
    "This message was sent by Fit Bazar Partner Support.",
  );
}
