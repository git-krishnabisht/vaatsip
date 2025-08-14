/*
  Warnings:

  - You are about to drop the column `google_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."users_google_id_key";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "google_id",
DROP COLUMN "refresh_token";
