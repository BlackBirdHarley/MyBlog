CREATE TABLE "ArticlePin" (
  "id"          TEXT NOT NULL,
  "articleId"   TEXT NOT NULL,
  "imageUrl"    TEXT NOT NULL,
  "description" TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticlePin_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArticlePin_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ArticlePin_articleId_sortOrder_idx" ON "ArticlePin"("articleId", "sortOrder");
