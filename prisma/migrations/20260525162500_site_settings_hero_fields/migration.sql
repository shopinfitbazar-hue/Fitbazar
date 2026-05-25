ALTER TABLE "SiteSettings"
  ADD COLUMN "heroEyebrow" TEXT NOT NULL DEFAULT 'Nepal''s premium fashion marketplace',
  ADD COLUMN "heroTitle" TEXT NOT NULL DEFAULT 'Discover sharper style, faster shopping, and curated Nepal-first fashion.',
  ADD COLUMN "heroSubtitle" TEXT NOT NULL DEFAULT 'Mobile-first discovery, partner-led fashion drops, and cleaner product storytelling built for modern shoppers.',
  ADD COLUMN "heroPrimaryLabel" TEXT NOT NULL DEFAULT 'Shop New Arrivals',
  ADD COLUMN "heroPrimaryHref" TEXT NOT NULL DEFAULT '/products',
  ADD COLUMN "heroSecondaryLabel" TEXT NOT NULL DEFAULT 'Explore Collections',
  ADD COLUMN "heroSecondaryHref" TEXT NOT NULL DEFAULT '/discover';
