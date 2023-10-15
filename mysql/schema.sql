CREATE TABLE IF NOT EXISTS `happycake`.`reservations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cake` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `byear` SMALLINT NOT NULL,
  `bmonth` TINYINT NOT NULL,
  `bdate` TINYINT NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` ENUM('helsinki', 'espoo', 'vantaa') NOT NULL,
  `image` VARCHAR(50), 
  `message` VARCHAR(255),
  `youtube` VARCHAR(255),
  `twitter` VARCHAR(255),
  `ordernumber` VARCHAR(255) NOT NULL,
  `status` ENUM('processing', 'delivered') NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_city` (`city`),
  INDEX `idx_status` (`status`),
  INDEX `idx_bmonth` (`bmonth`),
  INDEX `idx_bdate` (`bdate`))
CHARACTER SET = utf8mb4
COLLATE = utf8mb4_swedish_ci;

REVOKE ALL PRIVILEGES ON `happycake`.* FROM 'caker';
GRANT SELECT, INSERT, UPDATE, DELETE ON `happycake`.`reservations` TO 'caker';
