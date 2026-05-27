import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/vendor/register"],
        disallow: [
          "/api/",
          "/admin/",
          "/account/",
          "/vendor/",
          "/cart",
          "/checkout",
          "/dev-access",
          "/logout",
          "/order-confirmation",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/unauthorized",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
