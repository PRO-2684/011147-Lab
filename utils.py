from pymysql import connect, Connection
from pymysql.cursors import Cursor
from json import load
from secrets import token_urlsafe

TABLES = {
    "major": ["major_id", "major_name", "major_stu_num", "dean"],
    "class": ["class_id", "class_name", "class_stu_num", "advisor", "major_id"],
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
RENAME_FIELD_TO_TABLE = {
    "major_id": "major",
    "class_id": "class",
    "stu_id": "student",
    "course_id": "course",
}
RENAME_ERRORS = {
    -1: "Unexpected error",
    0: "Success",
    1: "oldId not found",
    2: "newId already exists",
}
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


# Database operations


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
        columns = []
        values = []
        for col in TABLES[table]:
            if col in kwargs:
                columns.append(col)
                values.append(kwargs[col])
        try:
            r = cur.execute(
                f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(['%s' for _ in range(len(values))])})",
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


def renamePK(conn: "Connection[Cursor]", field: str, oldId: str, newId: str) -> tuple[bool, str]:
    """Rename the primary key value."""
    table = RENAME_FIELD_TO_TABLE.get(field, None)
    state = 0
    if not table:
        return False, "Invalid field"
    with conn.cursor() as cur:
        # It should work, but PyMySQL does not support OUT parameters
        # =====
        # try:
        #     r = cur.callproc(f"rename_{field}", (oldId, newId, state))
        # except Exception as e:
        #     return False, str(e)
        # conn.commit()
        # print("renamePK", r, state)
        # state = r[-1]
        # return not state, RENAME_ERRORS.get(state, "Unknown error")
        # =====
        # Workaround
        try:
            cur.execute(f"CALL rename_{field}(%s, %s, @state)", (oldId, newId))
            cur.execute("SELECT @state")
            state = cur.fetchone()[0]
        except Exception as e:
            return False, str(e)
        conn.commit()
        return not state, RENAME_ERRORS.get(state, "Unknown error")


# Student operations


def fetchCourses(conn: "Connection[Cursor]") -> tuple[tuple]:
    """Fetch all courses."""
    return fetchTable(conn, "course")


studentFields = [
    f"student.{col}" for col in TABLES["student"][:-1]
]  # Remove duplicate `class_id`
classFields = [
    f"class.{col}" for col in TABLES["class"][:-1]
]  # Remove duplicate `major_id`
majorFields = [f"major.{col}" for col in TABLES["major"]]
cols = ", ".join(studentFields + classFields + majorFields)
sql = f"SELECT {cols} FROM student, class, major WHERE student.class_id = class.class_id AND class.major_id = major.major_id AND student.stu_id = %s"


def getStuInfo(conn: "Connection[Cursor]", stu_id: str) -> tuple | None:
    """Get the student's information, including the class and major."""
    with conn.cursor() as cur:
        cur.execute(sql, (stu_id,))
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


def getStuScores(conn: "Connection[Cursor]", stu_id: str) -> tuple[tuple]:
    """Get the student's grades."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT course.course_id, course.course_name, score FROM course, score WHERE course.course_id = score.course_id AND score.stu_id = %s",
            (stu_id,),
        )
        return cur.fetchall()


def getStuAvgScore(conn: "Connection[Cursor]", stu_id: str) -> float | None:
    """Get the student's average score."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT calculate_avg_score(%s)",
            (stu_id,),
        )
        result = cur.fetchone()[0]
        print(result)
        return result


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
