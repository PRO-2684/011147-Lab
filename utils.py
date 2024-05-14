from mysqlx import get_session, Session
from mysqlx.errors import InterfaceError
from json import load

with open("config.json", "r") as f:
    config = load(f)

def init_db(session: Session):
    with open("backend/create-db.sql", "r") as f:
        sql = f.read().format(database=config['database'])
    session.sql(sql).execute()
    print(f"Database `{config['database']}` initialized")

def init_session(port: int = 33060) -> Session:
    try:
        session = get_session({
            'host': 'localhost',
            'port': port,
            'user': config['user'],
            'password': config['password']
        })
    except InterfaceError as e:
        print("Error: Could not connect to the database due to", e)
        return
    # Check if the database exists
    result = session.sql(f"SHOW DATABASES LIKE '{config['database']}'").execute()
    if not result.fetch_one():
        init_db(session)
    else:
        print(f"Database `{config['database']}` already exists")
    session.sql(f"USE `{config['database']}`").execute()
    return session

if __name__ == "__main__":
    session = init_session()
    if session:
        session.close()
