# 011147-Lab

Lab2 of course 011147.02 at USTC. (数据库系统及应用, An Introduction to Database System)

## Setup

1. Install [Python 3.8+](https://www.python.org/downloads/)
2. Install [MySQL 8.0+](https://dev.mysql.com/doc/refman/8.0/en/installing.html)
3. Install required packages via `pip install -r requirements.txt`
4. Allow script execution via `chmod +x ./scripts/*`
5. Modify `config.json` to fit your MySQL username and password

## Usage

- Connect to MySQL console: `./scripts/console.sh` (need `jq` installed)
- Start development server: `./scripts/dev.sh`
- Start production server: `./scripts/prod.sh`
- Will start MySQL service when script is executed, and stop it after Flask server is closed.

## Acknowledgements

- This project's backend is written in [Python](https://www.python.org/) language.
- This project's backend uses [Flask](https://flask.palletsprojects.com/) as the web framework.
- This project's database is managed by [MySQL](https://www.mysql.com/).
- The favicon is from [SVG Repo](https://www.svgrepo.com/svg/482504/student-cap).
