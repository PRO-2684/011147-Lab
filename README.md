# 011147-Lab

Lab2 of course 011147.02 at USTC. (数据库系统及应用, An Introduction to Database System)

## Setup

1. Install [Python 3.8+](https://www.python.org/downloads/)
2. Install [MySQL 8.0+](https://dev.mysql.com/doc/refman/8.0/en/installing.html)
3. Install required packages via `pip install -r requirements.txt`
4. Allow script execution via `chmod +x ./scripts/*`
5. Modify `config.json` to fit your MySQL username and password

## Usage

### Scripts

- Connect to MySQL console: `./scripts/console.sh` (need `jq` installed)
- Start development server: `./scripts/dev.sh`
- Start production server: `./scripts/prod.sh`
- Will start MySQL service when script is executed, and stop it after Flask server is closed.

### Admin Account

- An admin account is created the first time the server is started. The default username is `admin` and the default password is `admin`.
- Admins can manage students, courses, and grades.
- Admins can change their own username and password.
- You can only add/delete admin accounts in the MySQL console.

## Architecture

### Database

```meimaid
erDiagram
    MAJOR ||..|{ CLASS : offers
    CLASS ||..|{ STUDENT : enrolls
    STUDENT }|..|{ COURSE : "takes (int score)"
    MAJOR {
        int major_id "*系号"
        string major_name "系名"
        string dean "系主任"
    }
    CLASS {
        int class_id "*班级号"
        string class_name "班级名"
        string advisor "班主任"
    }
    STUDENT {
        string stu_id "*学号"
        string stu_name "姓名"
        string tel "电话号码"
        string email "邮箱"
        bool sex "性别 (1 为男)"
    }
    COURSE {
        string course_id "*课程号"
        string course_name "课程名"
        string course_desc "课程描述"
        string semester "开课学期"
        string teacher "主讲教师"
        float credit "学分"
        int hours "课时"
    }
```

## Acknowledgements

- This project's backend is written in [Python](https://www.python.org/) language.
- This project's backend uses [Flask](https://flask.palletsprojects.com/) as the web framework.
- This project's database is managed by [MySQL](https://www.mysql.com/).
- The favicon is from [SVG Repo](https://www.svgrepo.com/svg/482504/student-cap).
