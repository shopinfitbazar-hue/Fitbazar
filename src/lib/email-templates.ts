function renderShell(title: string, intro: string, ctaLabel: string, ctaUrl: string, footerNote: string) {
  return `
    <div style="background:#F4F4F4;padding:24px;font-family:Arial,sans-serif;color:#282C3F;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #EAEAEC;border-radius:12px;overflow:hidden;">
        <div style="padding:20px 24px;background:#FF3F6C;color:#FFFFFF;">
          <div style="font-size:24px;font-weight:700;">fitbazar</div>
          <div style="font-size:12px;opacity:0.85;">Nepal's Fashion Store</div>
        </div>
        <div style="padding:24px;">
          <h2 style="margin:0 0 12px;font-size:22px;color:#282C3F;">${title}</h2>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#535766;">${intro}</p>
          <p style="margin:0 0 20px;">
            <a href="${ctaUrl}" style="display:inline-block;padding:12px 20px;background:#FF3F6C;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:600;">${ctaLabel}</a>
          </p>
          <p style="margin:0 0 8px;font-size:12px;color:#94969F;">If the button does not work, use this link:</p>
          <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#535766;">${ctaUrl}</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#94969F;">${footerNote}</p>
        </div>
      </div>
    </div>
  `;
}

export function renderPasswordResetEmail(name: string, resetUrl: string) {
  return renderShell(
    "Reset your Fit Bazar password",
    `Hello ${name}, we received a request to reset your password. Use the secure button below within the next hour.`,
    "Reset Password",
    resetUrl,
    "If you did not request this password reset, you can safely ignore this email.",
  );
}

export function renderEmailVerificationEmail(name: string, verificationUrl: string) {
  return renderShell(
    "Verify your Fit Bazar email",
    `Hello ${name}, confirm your email address to keep your Fit Bazar account secure and fully active.`,
    "Verify Email",
    verificationUrl,
    "If you did not create this account, you can ignore this email.",
  );
}
