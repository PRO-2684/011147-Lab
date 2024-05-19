from flask import Flask, send_from_directory, redirect, abort, request
from utils import (
    log,
    initConnection,
    queryAdmin,
    queryStudent,
    fetchTable,
    updateTable,
    insertTable,
    deleteTable,
    loginUser,
    logoutUser,
    loggedInQuery,
)
from functools import wraps
from os import getcwd
from argparse import ArgumentParser

session = initConnection()
if not session:
    print("Cannot establish connection to the database.")
    exit(1)
app = Flask(__name__)
CWD = getcwd()
WEB_ALLOWED_PATHS = [
    "index.html",
    "admin.html",
    "student.html",
    "static",
    "favicon.ico",
]


@app.route("/")  # Redirect to `index.html`
def index():
    return redirect("/index.html")


# Login & logout


@app.route("/api/whoami", methods=["POST"])
def whoAmI():
    token = request.json.get("token")
    result = loggedInQuery(token)
    log(token, "WhoAmI:", result)
    return {"success": bool(result), "data": result}


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if not data:
        return abort(400)
    username = data.get("username")
    password = data.get("password")
    isAdmin = bool(data.get("is_admin", False))
    print(
        f'{"Admin" if isAdmin else "Student"} login attempt: "{username}" "{password}"'
    )
    if isAdmin:
        data = queryAdmin(session, username, password)
    else:
        data = queryStudent(session, username, password)
    success = bool(data)
    token = loginUser(username, password, isAdmin) if success else ""
    if success:
        log(token, "Login successful")
    return {"success": success, "isAdmin": isAdmin, "data": data, "token": token}


@app.route("/api/logout", methods=["POST"])
def logout():
    token = request.json.get("token")
    log(token, "Logout")
    return {"success": logoutUser(token)}


# Helper functions


def adminOnly(func):
    """Decorator to restrict access to admin users only."""
    @wraps(func) # Preserve the original function's metadata
    def wrapper():
        token = request.json.get("token")
        user = loggedInQuery(token)
        isAdmin = user.get("isAdmin") if user else False
        if not isAdmin:
            return abort(403)
        return func(token)
    return wrapper


# Admin operations


@app.route("/api/table/get", methods=["POST"])
@adminOnly
def tableGet(token):
    table = request.json.get("table")
    log(token, "TableGet", table)
    result = fetchTable(session, table)
    return {"success": bool(result), "data": result}


@app.route("/api/table/update", methods=["POST"])
@adminOnly
def tableUpdate(token):
    table = request.json.get("table")
    pkValues = request.json.get("pkValues")
    colIdx = request.json.get("colIdx")
    newValue = request.json.get("newValue")
    success = updateTable(session, table, pkValues, colIdx, newValue)
    if success:
        log(token, "TableUpdate", table, pkValues, colIdx, newValue)
    return {"success": success}


@app.route("/api/table/insert", methods=["POST"])
@adminOnly
def tableInsert(token):
    log(token, "TableInsert", request.json)
    success, error = insertTable(session, **request.json)
    if success:
        log(token, "TableInsert successful")
    else:
        log(token, "TableInsert failed", error)
    return {"success": success, "error": error}


@app.route("/api/table/delete", methods=["POST"])
@adminOnly
def tableDelete(token):
    table = request.json.get("table")
    pkValues = request.json.get("pkValues")
    success, error = deleteTable(session, table, pkValues)
    if success:
        log(token, "TableDelete", table, pkValues)
    return {"success": success, "error": error}

# Student operations

...

# Serve files


@app.route("/<path:filename>")  # Serve files from the current directory
def serveFile(filename: str):
    first_part = filename.split("/", 1)[0]
    if first_part not in WEB_ALLOWED_PATHS:
        return abort(404)
    return send_from_directory(CWD, filename)


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()
    app.run(port=args.port, debug=args.debug)
