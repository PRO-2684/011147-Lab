-- Create the database used to store our tables
DROP DATABASE IF EXISTS `student_management`;
CREATE DATABASE `student_management`;
USE `student_management`;

-- The `admin` table
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Default admin account
INSERT INTO `admin` (`admin_id`, `username`, `password`) VALUES (1, 'admin', 'admin'); 

-- The `major` table
DROP TABLE IF EXISTS `major`;
CREATE TABLE `major` (
  `major_id` int(11) NOT NULL,
  `major_name` varchar(255) NOT NULL,
  `major_stu_num` int(11) NOT NULL DEFAULT 0,
  `dean` varchar(255) NOT NULL,
  PRIMARY KEY (`major_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Example major
INSERT INTO `major` (`major_id`, `major_name`, `dean`) VALUES (1, 'Computer Science', 'John Doe');

-- The `class` table
DROP TABLE IF EXISTS `class`;
CREATE TABLE `class` (
  `class_id` int(11) NOT NULL,
  `class_name` varchar(255) NOT NULL,
  `class_stu_num` int(11) NOT NULL DEFAULT 0,
  `advisor` varchar(255) NOT NULL,
  `major_id` int(11) NOT NULL,
  PRIMARY KEY (`class_id`),
  CONSTRAINT `class_ibfk_1` FOREIGN KEY (`major_id`) REFERENCES `major` (`major_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Example class
INSERT INTO `class` (`class_id`, `class_name`, `advisor`, `major_id`) VALUES (1, 'CS101', 'Jane Doe', 1);

-- The `student` table
DROP TABLE IF EXISTS `student`;
CREATE TABLE `student` (
  `stu_id` varchar(10) NOT NULL,
  `stu_password` varchar(255) NOT NULL,
  `stu_name` varchar(255) NOT NULL,
  `sex` tinyint(1) NOT NULL, -- `1` for male, `0` for female
  `tel` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `class_id` int(11) NOT NULL,
  PRIMARY KEY (`stu_id`),
  CONSTRAINT `student_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `class` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Trigger to update `major_stu_num` and `class_stu_num` when a student is added or removed
DELIMITER //
CREATE TRIGGER `student_after_insert` AFTER INSERT ON `student`
FOR EACH ROW
BEGIN
  UPDATE `class` SET `class_stu_num` = `class_stu_num` + 1 WHERE `class_id` = NEW.class_id;
  UPDATE `major` SET `major_stu_num` = `major_stu_num` + 1 WHERE `major_id` = (SELECT `major_id` FROM `class` WHERE `class_id` = NEW.class_id);
END;
//
CREATE TRIGGER `student_after_delete` AFTER DELETE ON `student`
FOR EACH ROW BEGIN
  UPDATE `class` SET `class_stu_num` = `class_stu_num` - 1 WHERE `class_id` = OLD.class_id;
  UPDATE `major` SET `major_stu_num` = `major_stu_num` - 1 WHERE `major_id` = (SELECT `major_id` FROM `class` WHERE `class_id` = OLD.class_id);
END; //
DELIMITER ;
-- Example student
INSERT INTO `student` (`stu_id`, `stu_password`, `stu_name`, `sex`, `tel`, `email`, `class_id`) VALUES ('PB21114514', 'p@ssw0rd', 'Alice', 0, '12345678901', 'alice@example.com', 1);

-- The `course` table
DROP TABLE IF EXISTS `course`;
CREATE TABLE `course` (
  `course_id` int(11) NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `course_desc` varchar(255) NOT NULL,
  `semester` varchar(255) NOT NULL,
  `teacher` varchar(255) NOT NULL,
  `credit` int(11) NOT NULL,
  `hours` int(11) NOT NULL,
  PRIMARY KEY (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The `score` table ((stu_id, course_id) -> score)
DROP TABLE IF EXISTS `score`;
CREATE TABLE `score` (
  `stu_id` varchar(10) NOT NULL,
  `course_id` int(11) NOT NULL,
  `score` tinyint UNSIGNED NOT NULL,
  PRIMARY KEY (`stu_id`, `course_id`),
  CONSTRAINT `score_ibfk_1` FOREIGN KEY (`stu_id`) REFERENCES `student` (`stu_id`),
  CONSTRAINT `score_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`),
  CHECK (`score` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Stored procedure(s) & function(s)
DELIMITER //

-- Stored procedure to rename `major_id`
-- Example: CALL rename_major_id(1, 2, @state); SELECT @state;
-- Parameters: `old_id` and `new_id`
-- Output: `state` to indicate the result
-- state: 0 for success, 1 for `old_id` not found, 2 for `new_id` already exists, -1 for unexpected errors
DROP PROCEDURE IF EXISTS `rename_major_id`;
CREATE PROCEDURE `rename_major_id`(IN old_id INT, IN new_id INT, OUT state INT) BEGIN
  -- Variables
  DECLARE s INT DEFAULT 0; -- State
  DECLARE tmp INT DEFAULT 0; -- Temporary variable to check if `old_id`/`new_id` exists

  -- Error handling
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET s = -1; -- Other errors
  SET foreign_key_checks = FALSE;

  --  Main transaction: Update `major_id` in `major` and `class`
  START TRANSACTION;
  SELECT COUNT(*) INTO tmp FROM `major` WHERE `major_id` = old_id;
  IF tmp = 0 THEN
    SET s = 1; -- `old_id` not found
  ELSE
    SELECT COUNT(*) INTO tmp FROM `major` WHERE `major_id` = new_id;
    IF tmp > 0 THEN
      SET s = 2; -- `new_id` already exists
    END IF;
  END IF;
  IF s = 0 THEN
    UPDATE `major` SET `major_id` = new_id WHERE `major_id` = old_id;
    UPDATE `class` SET `major_id` = new_id WHERE `major_id` = old_id;
    COMMIT;
  ELSE
    ROLLBACK;
  END IF;
  SET foreign_key_checks = TRUE;
  SET state = s;
END; //

-- Stored procedure to rename `class_id`
-- Example: CALL rename_class_id(1, 2, @state); SELECT @state;
-- Parameters: `old_id` and `new_id`
-- Output: `state` to indicate the result
-- state: 0 for success, 1 for `old_id` not found, 2 for `new_id` already exists, -1 for unexpected errors
DROP PROCEDURE IF EXISTS `rename_class_id`;
CREATE PROCEDURE `rename_class_id`(IN old_id INT, IN new_id INT, OUT state INT) BEGIN
  -- Variables
  DECLARE s INT DEFAULT 0; -- State
  DECLARE tmp INT DEFAULT 0; -- Temporary variable to check if `old_id`/`new_id` exists

  -- Error handling
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET s = -1; -- Other errors
  SET foreign_key_checks = FALSE;

  --  Main transaction: Update `class_id` in `class` and `student`
  START TRANSACTION;
  SELECT COUNT(*) INTO tmp FROM `class` WHERE `class_id` = old_id;
  IF tmp = 0 THEN
    SET s = 1; -- `old_id` not found
  ELSE
    SELECT COUNT(*) INTO tmp FROM `class` WHERE `class_id` = new_id;
    IF tmp > 0 THEN
      SET s = 2; -- `new_id` already exists
    END IF;
  END IF;
  IF s = 0 THEN
    UPDATE `class` SET `class_id` = new_id WHERE `class_id` = old_id;
    UPDATE `student` SET `class_id` = new_id WHERE `class_id` = old_id;
    COMMIT;
  ELSE
    ROLLBACK;
  END IF;
  SET foreign_key_checks = TRUE;
  SET state = s;
END; //

-- Stored procedure to rename `stu_id`
-- Example: CALL rename_stu_id('PB21114514', 'PB21114515', @state); SELECT @state;
-- Parameters: `old_id` and `new_id`
-- Output: `state` to indicate the result
-- state: 0 for success, 1 for `old_id` not found, 2 for `new_id` already exists, -1 for unexpected errors
DROP PROCEDURE IF EXISTS `rename_stu_id`;
CREATE PROCEDURE `rename_stu_id`(IN old_id VARCHAR(10), IN new_id VARCHAR(10), OUT state INT) BEGIN
  -- Variables
  DECLARE s INT DEFAULT 0; -- State
  DECLARE tmp INT DEFAULT 0; -- Temporary variable to check if `old_id`/`new_id` exists

  -- Error handling
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET s = -1; -- Other errors
  SET foreign_key_checks = FALSE;

  --  Main transaction: Update `stu_id` in `student` and `score`
  START TRANSACTION;
  SELECT COUNT(*) INTO tmp FROM `student` WHERE `stu_id` = old_id;
  IF tmp = 0 THEN
    SET s = 1; -- `old_id` not found
  ELSE
    SELECT COUNT(*) INTO tmp FROM `student` WHERE `stu_id` = new_id;
    IF tmp > 0 THEN
      SET s = 2; -- `new_id` already exists
    END IF;
  END IF;
  IF s = 0 THEN
    UPDATE `student` SET `stu_id` = new_id WHERE `stu_id` = old_id;
    UPDATE `score` SET `stu_id` = new_id WHERE `stu_id` = old_id;
    COMMIT;
  ELSE
    ROLLBACK;
  END IF;
  SET foreign_key_checks = TRUE;
  SET state = s;
END; //

-- Stored procedure to rename `course_id`
-- Example: CALL rename_course_id(1, 2, @state); SELECT @state;
-- Parameters: `old_id` and `new_id`
-- Output: `state` to indicate the result
-- state: 0 for success, 1 for `old_id` not found, 2 for `new_id` already exists, -1 for unexpected errors
DROP PROCEDURE IF EXISTS `rename_course_id`;
CREATE PROCEDURE `rename_course_id`(IN old_id INT, IN new_id INT, OUT state INT) BEGIN
  -- Variables
  DECLARE s INT DEFAULT 0; -- State
  DECLARE tmp INT DEFAULT 0; -- Temporary variable to check if `old_id`/`new_id` exists

  -- Error handling
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET s = -1; -- Other errors
  SET foreign_key_checks = FALSE;

  --  Main transaction: Update `course_id` in `course` and `score`
  START TRANSACTION;
  SELECT COUNT(*) INTO tmp FROM `course` WHERE `course_id` = old_id;
  IF tmp = 0 THEN
    SET s = 1; -- `old_id` not found
  ELSE
    SELECT COUNT(*) INTO tmp FROM `course` WHERE `course_id` = new_id;
    IF tmp > 0 THEN
      SET s = 2; -- `new_id` already exists
    END IF;
  END IF;
  IF s = 0 THEN
    UPDATE `course` SET `course_id` = new_id WHERE `course_id` = old_id;
    UPDATE `score` SET `course_id` = new_id WHERE `course_id` = old_id;
    COMMIT;
  ELSE
    ROLLBACK;
  END IF;
  SET foreign_key_checks = TRUE;
  SET state = s;
END; //

-- Tests
-- CALL rename_*_id(1, 2, @state); SELECT @state;
-- > 0 (success)
-- CALL rename_*_id(1, 2, @state); SELECT @state;
-- > 1 (`old_id` not found)
-- CALL rename_*_id(2, 2, @state); SELECT @state;
-- > 2 (`new_id` already exists)
-- CALL rename_*_id(2, 1, @state); SELECT @state;
-- > 0 (success)

-- Function to calculate the average score of a student
-- Example: SELECT calculate_avg_score('PB21114514');
DROP FUNCTION IF EXISTS `calculate_avg_score`;
CREATE FUNCTION `calculate_avg_score`(stu_id VARCHAR(10)) RETURNS FLOAT DETERMINISTIC BEGIN
  DECLARE avg_score FLOAT;
  SELECT AVG(`score`) INTO avg_score FROM `score` WHERE `stu_id` = stu_id;
  RETURN avg_score;
END; //


DELIMITER ;
