-- AlterTable: add objectKey to publication
ALTER TABLE "publication" ADD COLUMN "objectKey" TEXT;

-- AlterTable: add instagramPermalink to publication_target
ALTER TABLE "publication_target" ADD COLUMN "instagramPermalink" TEXT;
