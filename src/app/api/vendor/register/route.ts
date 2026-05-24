import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { buildAppUrl, createOpaqueToken, hashOpaqueToken } from "@/lib/tokens";
import { hasConfiguredMailTransport, sendMail } from "@/lib/mailer";
import { renderEmailVerificationEmail } from "@/lib/email-templates";

async function buildUniqueVendorSlug(shopName: string) {
  const base = slugify(shopName);
  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.vendor.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      shopName?: string;
      shopDescription?: string;
      ownerName?: string;
      email?: string;
      phone?: string;
      panNumber?: string;
      address?: string;
      zone?: string;
      district?: string;
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
      password?: string;
      confirmPassword?: string;
    };

    const shopName = body.shopName?.trim();
    const ownerName = body.ownerName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const panNumber = body.panNumber?.trim();
    const password = body.password?.trim();
    const confirmPassword = body.confirmPassword?.trim();

    if (!shopName || !ownerName || !email || !phone || !panNumber || !password || !confirmPassword) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        vendorProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (existingUser?.vendorProfile) {
      return NextResponse.json({ error: "A vendor account already exists for this email." }, { status: 409 });
    }

    if (existingUser) {
      return NextResponse.json({ error: "This email is already in use by another account." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const vendorSlug = await buildUniqueVendorSlug(shopName);

    const shouldRequireVerification = hasConfiguredMailTransport();
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email,
          phone,
          password: hashedPassword,
          role: Role.VENDOR,
          emailVerified: shouldRequireVerification ? null : new Date(),
        },
      });

      const vendor = await tx.vendor.create({
        data: {
          userId: user.id,
          shopName,
          slug: vendorSlug,
          description: body.shopDescription?.trim() || "",
          category: "Pending Approval",
          phone,
          address: body.address?.trim() || null,
          zone: body.zone?.trim() || null,
          district: body.district?.trim() || null,
          panNumber,
          bankAccount: [body.bankName, body.accountNumber, body.accountHolder].filter(Boolean).join(" • "),
          bankName: body.bankName?.trim() || null,
          accountNumber: body.accountNumber?.trim() || null,
          accountHolder: body.accountHolder?.trim() || null,
          verificationStatus: "PENDING",
          isApproved: false,
          isSuspended: false,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        vendor: {
          id: vendor.id,
          slug: vendor.slug,
          shopName: vendor.shopName,
        },
      };
    });

    if (shouldRequireVerification) {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: `email-verification:${email}`,
        },
      });

      const rawToken = createOpaqueToken();
      const hashedToken = hashOpaqueToken(rawToken);
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await prisma.verificationToken.create({
        data: {
          identifier: `email-verification:${email}`,
          token: hashedToken,
          expires,
        },
      });

      const verificationUrl = buildAppUrl(`/verify-email?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`);
      await sendMail({
        to: email,
        subject: "Verify your Fit Bazar vendor account",
        text: `Verify your vendor email using this link: ${verificationUrl}`,
        html: renderEmailVerificationEmail(ownerName, verificationUrl),
      }).catch(() => undefined);
    }

    return NextResponse.json(
      {
        user: created.user,
        vendor: created.vendor,
        message: "Vendor application submitted. You can log in now while your store is under review.",
        verificationRequired: shouldRequireVerification,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Vendor register error:", error);
    return NextResponse.json({ error: "Unable to create vendor account right now." }, { status: 500 });
  }
}
