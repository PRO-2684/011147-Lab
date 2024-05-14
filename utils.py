from pymysql import connect, Connection
from pymysql.cursors import Cursor
from json import load

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

if __name__ == "__main__":
    conn = initConnection(config.get("port", 3306))
    if conn:
        conn.close()
