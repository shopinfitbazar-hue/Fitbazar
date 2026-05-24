export function hasConfiguredGoogleOAuth(config: {
  clientId?: string;
  clientSecret?: string;
}) {
  return (
    !!config.clientId &&
    !!config.clientSecret &&
    !config.clientId.startsWith("your-") &&
    !config.clientSecret.startsWith("your-") &&
    config.clientId !== "placeholder" &&
    config.clientSecret !== "placeholder"
  );
}

export function getGoogleOAuthCallbackUrls(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return {
    nextAuthCallback: `${normalizedBaseUrl}/api/auth/callback/google`,
    loginPage: `${normalizedBaseUrl}/login`,
  };
}
