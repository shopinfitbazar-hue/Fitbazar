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

export function renderOrderPlacedEmail(name: string, orderNumber: string, orderUrl: string) {
  return renderShell(
    "Your Fit Bazar order is confirmed",
    `Hello ${name}, your order ${orderNumber} has been placed successfully. We will keep you updated as the vendor prepares it.`,
    "View Order",
    orderUrl,
    "Thank you for shopping with Fit Bazar.",
  );
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
