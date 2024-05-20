# 011147-Lab

Lab2 of course 011147.02 at USTC. (数据库系统及应用, An Introduction to Database System)

## Setup

1. Install [Python 3.8+](https://www.python.org/downloads/)
2. Install [MySQL 8.0+](https://dev.mysql.com/doc/refman/8.0/en/installing.html)
3. Install required packages via `pip install -r requirements.txt`
4. Allow script execution via `chmod +x ./scripts/*`
5. Modify `config.json` to fit your MySQL username and password (If you intend to change database name, you need to modify `backend/create-db.sql` as well)
6. Run `./scripts/init-db.sh` to initialize the database

## Usage

### Scripts

- Initialize database: `./scripts/init-db.sh` (Will auto start MySQL service)
- Connect to MySQL console: `./scripts/console.sh` (Will auto start MySQL service, need `jq` installed)
- Start development server: `./scripts/dev.sh` (Will auto start MySQL service)
- Start production server: `./scripts/prod.sh` (Will auto start MySQL service)
- Stop MySQL service: `./scripts/stop-mysql.sh`

### Admin Account(s)

- An admin account is created the first time the server is started. The default username is `admin` and the default password is `admin`.
- Admins can manage students, courses, and grades.
- Admins can change their own username and password.
- You can only add/delete admin accounts in the MySQL console.

### Student Account(s)

- Students can query all courses and their own grades.
- Students can view their own basic information.
- Students can change their own password, tel, and email.

### Dummy Data

See the last few lines of `backend/create-db.sql` for dummy data.

### Debugging

- Debug frontend: append `debug=true` to the URL search parameters
    - `admin.html?debug=true` / `student.html?debug=true`: Will expose all dataTables under `window.dataTables`

## Architecture

### Database

```mermaid
erDiagram
    MAJOR ||..|{ CLASS : offers
    CLASS ||..|{ STUDENT : enrolls
    STUDENT }|..|{ COURSE : "takes (int score)"
    MAJOR {
        int major_id "*Major ID"
        string major_name "Major Name"
        int major_stu_num "Major Student Count"
        string dean "Dean"
    }
    CLASS {
        int class_id "*Class ID"
        string class_name "Class Name"
        int class_stu_num "Class Student Count"
        string advisor "Advisor"
    }
    STUDENT {
        string stu_id "*Student ID"
        string stu_name "Student Name"
        string tel "Tel"
        string email "Email"
        bool sex "Sex (1 for male)"
    }
    COURSE {
        string course_id "*Course ID"
        string course_name "Course Name"
        string course_desc "Course Desc"
        string semester "Semester"
        string teacher "Teacher"
        float credit "Credit"
        int hours "Hours"
    }
```

## Roadmap

### Admin

- [x] Create
- [x] Retrieve
- [x] Update
- [x] Delete

### Student

- [x] Retrieve
- [x] Update

### Other

- [x] Student profile picture
    - [x] View
    - [x] Update
- [x] Stored procedure & Transaction: Renaming primary keys on tables
- [x] Trigger: Auto-update student count in class and major tables
- [x] Function: Calculate GPA

## Acknowledgements

- This project's database is managed by [MySQL](https://www.mysql.com/).
- This project's backend is written in [Python](https://www.python.org/) language, using [Flask](https://flask.palletsprojects.com/) as the web framework and [PyMySQL](https://pymysql.readthedocs.io/en/latest/user/examples.html) to interact with MySQL.
- The frontend uses [simple-datatables](https://github.com/fiduswriter/simple-datatables/) to display and modify data in tables.
- The favicon is from [SVG Repo](https://www.svgrepo.com/svg/482504/student-cap).
