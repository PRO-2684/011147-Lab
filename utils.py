from pymysql import connect, Connection
from pymysql.cursors import Cursor
from json import load
from secrets import token_urlsafe

# token -> user
loggedInUsers: dict[str, dict] = {}

with open("config.json", "r") as f:
    config = load(f)

def initConnection(port: int = 3306) -> "Connection[Cursor]":
    """Initialize a session with the database. If the database does not exist, create it."""
    try:
        conn = connect(
            host='localhost',
            port=port,
            user=config['user'],
            password=config['password']
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
            (username, password)
        )
        return cur.fetchone()

def queryStudent(conn: "Connection[Cursor]", username: str, password: str) -> tuple:
    """Check if student with given username and password exists."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM student WHERE stu_id = %s AND stu_password = %s",
            (username, password)
        )
        return cur.fetchone()

def loginUser(username: str, password: str, isAdmin: bool) -> str:
    # Check if the user has already logged in
    for token, data in loggedInUsers.items():
        if data["username"] == username and data["password"] == password and data["isAdmin"] == isAdmin:
            return token
    # Generate a new token
    token = token_urlsafe(16)
    loggedInUsers[token] = {"username": username, "password": password, "isAdmin": isAdmin}
    return token

def logoutUser(token: str) -> bool:
    if token in loggedInUsers:
        del loggedInUsers[token]
        return True
    else:
        return False

def loggedInQuery(token) -> dict[str, str | bool] | None:
    return loggedInUsers.get(token, None)

if __name__ == "__main__":
    conn = initConnection(config.get("port", 3306))
    if conn:
        conn.close()
