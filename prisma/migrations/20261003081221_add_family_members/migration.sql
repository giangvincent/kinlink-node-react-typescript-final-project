/*
  Warnings:

  - You are about to drop the column `family_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_family_id_fkey`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `family_id`;

-- CreateTable
CREATE TABLE IF NOT EXISTS `family_members` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `family_id` VARCHAR(191) NOT NULL,
    `role` ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `family_members_family_id_idx`(`family_id`),
    UNIQUE INDEX `family_members_user_id_family_id_key`(`user_id`, `family_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
