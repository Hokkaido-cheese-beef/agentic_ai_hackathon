/*
  Warnings:

  - You are about to alter the column `status` on the `trip_groups` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `trip_groups` ADD COLUMN `departure` VARCHAR(191) NULL,
    MODIFY `status` ENUM('draft', 'active', 'completed') NOT NULL DEFAULT 'draft';

-- CreateTable
CREATE TABLE `trip_candidates` (
    `id` CHAR(36) NOT NULL,
    `trip_group_id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `image_url` VARCHAR(191) NULL,
    `rating` DOUBLE NULL,
    `review_count` INTEGER NULL,
    `tags` TEXT NULL,
    `info` TEXT NULL,
    `ai_summary` TEXT NULL,
    `source_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trip_candidates_trip_group_id_idx`(`trip_group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` CHAR(36) NOT NULL,
    `candidate_id` CHAR(36) NULL,
    `trip_group_id` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `ai_answer` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `questions_trip_group_id_idx`(`trip_group_id`),
    INDEX `questions_candidate_id_idx`(`candidate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `trip_candidates` ADD CONSTRAINT `trip_candidates_trip_group_id_fkey` FOREIGN KEY (`trip_group_id`) REFERENCES `trip_groups`(`trip_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_trip_group_id_fkey` FOREIGN KEY (`trip_group_id`) REFERENCES `trip_groups`(`trip_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_candidate_id_fkey` FOREIGN KEY (`candidate_id`) REFERENCES `trip_candidates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
