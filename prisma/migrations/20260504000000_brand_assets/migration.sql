-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "siteLogoUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "faviconUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "faviconUpdatedAt" TIMESTAMP(3);
