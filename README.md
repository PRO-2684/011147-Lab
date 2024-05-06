# 011147-Lab

Lab2 of course 011147.02 at USTC. (数据库系统及应用, An Introduction to Database System)

## Installation

1. Install [Python 3.8+](https://www.python.org/downloads/)
2. Install [MySQL 8.0+](https://dev.mysql.com/doc/refman/8.0/en/installing.html)
3. Install required packages via `pip install -r requirements.txt`
4. Allow script execution via `chmod +x ./scripts/*`

## Usage

- Start development server: `./scripts/dev.sh`
- Start production server: `./scripts/prod.sh`
- Will start MySQL service when script is executed, and stop it after Flask server is closed.
