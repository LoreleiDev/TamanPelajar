-- CreateTable
CREATE TABLE `Subject` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subject_name_key`(`name`),
    INDEX `Subject_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Isi daftar mata pelajaran dari teks yang sudah dipakai kelas, video, dan soal.
INSERT IGNORE INTO `Subject` (`id`, `name`, `order`, `createdAt`, `updatedAt`)
SELECT REPLACE(UUID(), '-', ''), s.subject, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM (
    SELECT DISTINCT `subject` FROM `Course`
    UNION SELECT DISTINCT `subject` FROM `Video`
    UNION SELECT DISTINCT `subject` FROM `Question`
) AS s
WHERE TRIM(s.subject) <> '';
