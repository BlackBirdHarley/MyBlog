ALTER TABLE "ArticlePin" ADD COLUMN "mediaId" TEXT;

UPDATE "ArticlePin"
SET "mediaId" = "Media"."id"
FROM "Media"
WHERE "ArticlePin"."imageUrl" = "Media"."url";

CREATE INDEX "ArticlePin_mediaId_idx" ON "ArticlePin"("mediaId");

ALTER TABLE "ArticlePin"
ADD CONSTRAINT "ArticlePin_mediaId_fkey"
FOREIGN KEY ("mediaId") REFERENCES "Media"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
