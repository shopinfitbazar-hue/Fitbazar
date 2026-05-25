export function hasConfiguredGoogleOAuth(config: {
  clientId?: string;
  clientSecret?: string;
}) {
  const clientId = config.clientId?.trim();
  const clientSecret = config.clientSecret?.trim();

  return (
    !!clientId &&
    !!clientSecret &&
    !clientId.startsWith("your-") &&
    !clientId.startsWith("your_") &&
    !clientSecret.startsWith("your-") &&
    !clientSecret.startsWith("your_") &&
    clientId !== "placeholder" &&
    clientSecret !== "placeholder"
  );
}

export function getGoogleOAuthCallbackUrls(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return {
    nextAuthCallback: `${normalizedBaseUrl}/api/auth/callback/google`,
    loginPage: `${normalizedBaseUrl}/login`,
  };
}
