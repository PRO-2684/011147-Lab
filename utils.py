from pymysql import connect, Connection
from pymysql.cursors import Cursor
from json import load
from secrets import token_urlsafe

TABLES = {
    "major": ["major_id", "major_name", "dean"],
    "class": ["class_id", "class_name", "advisor", "major_id"],
    "student": [
        "stu_id",
        "stu_password",
        "stu_name",
        "sex",
        "tel",
        "email",
        "class_id",
    ],
    "course": [
        "course_id",
        "course_name",
        "course_desc",
        "semester",
        "teacher",
        "credit",
        "hours",
    ],
    "score": ["stu_id", "course_id", "score"],
}
STUDENT_CAN_CHANGE = ["stu_password", "tel", "email"]
# token -> user
loggedInUsers: dict[str, dict] = {}

with open("config.json", "r") as f:
    config = load(f)


def log(token: str, *args, **kwargs):
    """Log the given message."""
    user = loggedInUsers.get(token, None)
    if user:
        badge = f"{'Admin' if user['isAdmin'] else 'Student'} {user['username']}"
    else:
        badge = token
    print(f"[{badge}]", *args, **kwargs)


def initConnection(port: int = 3306) -> "Connection[Cursor]":
    """Initialize a session with the database. If the database does not exist, create it."""
    try:
        conn = connect(
            host="localhost",
            port=port,
            user=config["user"],
            password=config["password"],
        )
    except Exception as e:
        print(f"Failed to connect to the database: {e}")
        return None
    # Check if the database exists
    with conn.cursor() as cur:
        cur.execute(f"SHOW DATABASES LIKE '{config['database']}'")
        if not cur.fetchone():
            print(f"Database `{config['database']}` does not exist!")
            exit(1)
    with conn.cursor() as cur:
        cur.execute(f"USE `{config['database']}`;")
    return conn


def queryAdmin(conn: "Connection[Cursor]", username: str, password: str) -> bool:
    """Check if admin with given username and password exists."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM admin WHERE username = %s AND password = %s",
            (username, password),
        )
        return cur.fetchone()


def queryStudent(conn: "Connection[Cursor]", username: str, password: str) -> tuple:
    """Check if student with given username and password exists."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM student WHERE stu_id = %s AND stu_password = %s",
            (username, password),
        )
        return cur.fetchone()


# Admin operations


def fetchTable(conn: "Connection[Cursor]", table: str) -> tuple[tuple]:
    """Fetch the given table."""
    if table not in TABLES:
        return tuple()
    with conn.cursor() as cur:
        cur.execute(f"SELECT * FROM {table}")
        return cur.fetchall()


def updateTable(
    conn: "Connection[Cursor]", table: str, pkValues: list[str], colIdx: int, newValue
) -> bool:
    """Update the given table with the given values."""
    if table not in TABLES:
        return False
    with conn.cursor() as cur:
        whereClause = " AND ".join(
            [f"{TABLES[table][i]} = %s" for i in range(len(pkValues))]
        )
        r = cur.execute(
            f"UPDATE {table} SET {TABLES[table][colIdx]} = %s WHERE {whereClause}",
            (newValue, *pkValues),
        )
        conn.commit()
        return bool(r)


def insertTable(conn: "Connection[Cursor]", table: str, **kwargs) -> tuple[bool, str]:
    """Insert the given values into the given table."""
    if table not in TABLES:
        return False
    with conn.cursor() as cur:
        values = [kwargs.get(col, None) for col in TABLES[table]]
        try:
            r = cur.execute(
                f"INSERT INTO {table} VALUES ({', '.join(['%s' for _ in range(len(values))])})",
                values,
            )
        except Exception as e:
            return False, str(e)
        conn.commit()
        return bool(r), "" if r else "Failed to insert"


def deleteTable(
    conn: "Connection[Cursor]", table: str, pkValues: list[str]
) -> tuple[bool, str]:
    """Delete the given row specified by the primary key values."""
    if table not in TABLES:
        return False
    with conn.cursor() as cur:
        whereClause = " AND ".join(
            [f"{TABLES[table][i]} = %s" for i in range(len(pkValues))]
        )
        try:
            r = cur.execute(f"DELETE FROM {table} WHERE {whereClause}", pkValues)
        except Exception as e:
            return False, str(e)
        conn.commit()
        return bool(r), "" if r else "Failed to delete"


# Student operations


def fetchCourses(conn: "Connection[Cursor]") -> tuple[tuple]:
    """Fetch all courses."""
    return fetchTable(conn, "course")


def getStuInfo(conn: "Connection[Cursor]", stu_id: str) -> tuple:
    """Get the student's information."""
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM student WHERE stu_id = %s", (stu_id,))
        return cur.fetchone()


def updateStuInfo(conn: "Connection[Cursor]", stu_id: str, **kwargs) -> bool:
    """Update the student's information."""
    with conn.cursor() as cur:
        keys = []
        values = []
        for col in STUDENT_CAN_CHANGE:
            if col in kwargs:
                keys.append(f"{col} = %s")
                values.append(kwargs[col])
        r = cur.execute(
            f"UPDATE student SET {', '.join(keys)} WHERE stu_id = %s", (*values, stu_id)
        )
        conn.commit()
        return bool(r)


def getStuGrades(conn: "Connection[Cursor]", stu_id: str) -> tuple[tuple]:
    """Get the student's grades."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT course.course_id, course.course_name, score FROM course, score WHERE course.course_id = score.course_id AND score.stu_id = %s",
            (stu_id,),
        )
        return cur.fetchall()


# Login & Logout


def loginUser(username: str, password: str, isAdmin: bool) -> str:
    """Log in the user and return a token."""
    # Check if the user has already logged in
    for token, data in loggedInUsers.items():
        if (
            data["username"] == username
            and data["password"] == password
            and data["isAdmin"] == isAdmin
        ):
            return token
    # Generate a new token
    token = token_urlsafe(16)
    loggedInUsers[token] = {
        "username": username,
        "password": password,
        "isAdmin": isAdmin,
    }
    return token


def logoutUser(token: str) -> bool:
    """Log out the user with the given token."""
    if token in loggedInUsers:
        del loggedInUsers[token]
        return True
    else:
        return False


def loggedInQuery(token) -> dict[str, str | bool] | None:
    """Query the logged in user with the given token."""
    return loggedInUsers.get(token, None)


if __name__ == "__main__":
    # Test the connection
    conn = initConnection(config.get("port", 3306))
    if conn:
        conn.close()
