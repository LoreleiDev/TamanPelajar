-- AlterTable
ALTER TABLE `Testimonial` ADD COLUMN `courseId` VARCHAR(191) NULL,
    ADD COLUMN `isPending` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SavedCourse` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SavedCourse_courseId_idx`(`courseId`),
    UNIQUE INDEX `SavedCourse_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Testimonial_isPending_idx` ON `Testimonial`(`isPending`);

-- CreateIndex
CREATE INDEX `Testimonial_courseId_idx` ON `Testimonial`(`courseId`);

-- CreateIndex
CREATE UNIQUE INDEX `Testimonial_userId_courseId_key` ON `Testimonial`(`userId`, `courseId`);

-- AddForeignKey
ALTER TABLE `Testimonial` ADD CONSTRAINT `Testimonial_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Testimonial` ADD CONSTRAINT `Testimonial_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedCourse` ADD CONSTRAINT `SavedCourse_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedCourse` ADD CONSTRAINT `SavedCourse_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

