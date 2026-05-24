import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isPlaceholderValue(value: string | undefined) {
  if (!value) return true;

  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("your-") ||
    normalized.startsWith("your_") ||
    normalized.includes("your-cloudinary") ||
    normalized === "your_cloud_name" ||
    normalized === "your_api_key" ||
    normalized === "your_api_secret"
  );
}

function hasCloudinaryConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET &&
      !isPlaceholderValue(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
      !isPlaceholderValue(process.env.CLOUDINARY_API_KEY) &&
      !isPlaceholderValue(process.env.CLOUDINARY_API_SECRET),
  );
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only vendors can upload product images" }, { status: 403 });
    }

    if (!hasCloudinaryConfig()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary is not configured yet. Replace the placeholder Cloudinary values in .env.local with your real Cloudinary cloud name, API key, and API secret before uploading images.",
        },
        { status: 503 },
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: "fit-bazar-products" },
      process.env.CLOUDINARY_API_SECRET as string,
    );

    return NextResponse.json({
      timestamp,
      signature,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: "fit-bazar-products",
    });
  } catch (error) {
    console.error("CLOUDINARY_SIGNATURE_ERROR", error);
    return NextResponse.json({ error: "Unable to generate upload signature" }, { status: 500 });
  }
}
