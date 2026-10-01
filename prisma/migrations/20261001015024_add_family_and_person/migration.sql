-- CreateTable
CREATE TABLE `families` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `families_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `people` (
    `id` VARCHAR(191) NOT NULL,
    `family_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `gender` ENUM('male', 'female', 'other', 'unknown') NOT NULL,
    `birth_date` DATE NULL,
    `death_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `people_family_id_idx`(`family_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `people` ADD CONSTRAINT `people_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
