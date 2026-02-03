-- Ensure both app_db and app_db_shadow exist for Prisma migrations
CREATE DATABASE IF NOT EXISTS `app_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `app_db_shadow` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Guarantee application user exists with access to both databases
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password';
GRANT ALL PRIVILEGES ON `app_db`.* TO 'app_user'@'%';
GRANT ALL PRIVILEGES ON `app_db_shadow`.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
