CREATE TABLE "StaticPage" (
  "id"        TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "content"   JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaticPage_pkey" PRIMARY KEY ("id")
);
