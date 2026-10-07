-- CreateTable
CREATE TABLE `invitations` (
    `id` VARCHAR(191) NOT NULL,
    `family_id` VARCHAR(191) NOT NULL,
    `role` ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
    `email` VARCHAR(191) NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_by` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `invitations_token_hash_key`(`token_hash`),
    INDEX `invitations_family_id_idx`(`family_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
