-- AlterTable
ALTER TABLE `Certificate` ADD COLUMN `minScore` INTEGER NOT NULL DEFAULT 80,
    ADD COLUMN `practicalInstructions` TEXT NULL,
    ADD COLUMN `practicalTemplateId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `UserCertificate` ADD COLUMN `participantId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `CourseBatch` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseBatch_courseId_startsAt_idx`(`courseId`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BatchParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('BERJALAN', 'MENUNGGU_PENILAIAN', 'REVISI', 'LULUS', 'GAGAL') NOT NULL DEFAULT 'BERJALAN',
    `isRetake` BOOLEAN NOT NULL DEFAULT false,
    `finalScore` DOUBLE NULL,
    `failReason` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BatchParticipant_userId_idx`(`userId`),
    INDEX `BatchParticipant_status_idx`(`status`),
    UNIQUE INDEX `BatchParticipant_batchId_userId_key`(`batchId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticalSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `driveUrl` VARCHAR(500) NOT NULL,
    `note` VARCHAR(1000) NULL,
    `status` ENUM('MENUNGGU', 'DISETUJUI', 'REVISI', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU',
    `reviewNote` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PracticalSubmission_participantId_idx`(`participantId`),
    INDEX `PracticalSubmission_status_idx`(`status`),
    INDEX `PracticalSubmission_reviewedById_idx`(`reviewedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Certificate_practicalTemplateId_idx` ON `Certificate`(`practicalTemplateId`);

-- CreateIndex
CREATE UNIQUE INDEX `UserCertificate_participantId_key` ON `UserCertificate`(`participantId`);

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_practicalTemplateId_fkey` FOREIGN KEY (`practicalTemplateId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseBatch` ADD CONSTRAINT `CourseBatch_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchParticipant` ADD CONSTRAINT `BatchParticipant_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `CourseBatch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchParticipant` ADD CONSTRAINT `BatchParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticalSubmission` ADD CONSTRAINT `PracticalSubmission_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `BatchParticipant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticalSubmission` ADD CONSTRAINT `PracticalSubmission_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCertificate` ADD CONSTRAINT `UserCertificate_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `BatchParticipant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

