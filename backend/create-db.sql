-- Create the database used to store our tables
CREATE DATABASE IF NOT EXISTS `student_management`;
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
