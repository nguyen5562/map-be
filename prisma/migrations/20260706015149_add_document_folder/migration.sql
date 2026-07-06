-- AlterTable
ALTER TABLE `Document` ADD COLUMN `folderId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `DocumentFolder` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `sectionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocumentFolder_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate virtual folders to DocumentFolder table
INSERT INTO `DocumentFolder` (`id`, `name`, `order`, `sectionId`, `updatedAt`, `createdAt`)
SELECT UUID(), `folder`, 0, `sectionId`, NOW(), NOW()
FROM `Document`
WHERE `folder` IS NOT NULL AND `folder` != ''
GROUP BY `sectionId`, `folder`;

-- Update folderId in Document table
UPDATE `Document` d
JOIN `DocumentFolder` f ON d.`sectionId` = f.`sectionId` AND d.`folder` = f.`name`
SET d.`folderId` = f.`id`
WHERE d.`folder` IS NOT NULL AND d.`folder` != '';

-- CreateIndex
CREATE INDEX `Document_folderId_idx` ON `Document`(`folderId`);

-- AddForeignKey
ALTER TABLE `DocumentFolder` ADD CONSTRAINT `DocumentFolder_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `DocumentSection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `DocumentFolder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

