CREATE TABLE "PinBoard" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PinBoard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PinBoard_name_key" ON "PinBoard"("name");
CREATE INDEX "PinBoard_isActive_name_idx" ON "PinBoard"("isActive", "name");

ALTER TABLE "ArticlePin" ADD COLUMN "boardId" TEXT;
CREATE INDEX "ArticlePin_boardId_idx" ON "ArticlePin"("boardId");
ALTER TABLE "ArticlePin" ADD CONSTRAINT "ArticlePin_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "PinBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
