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
    renamePK,
    fetchCourses,
    getStuInfo,
    updateStuInfo,
    getStuScores,
    getStuAvgScore,
    loginUser,
    logoutUser,
    loggedInQuery,
)
from functools import wraps
from os import getcwd
from os.path import join, exists
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

    @wraps(func)  # Preserve the original function's metadata
    def wrapper():
        token = request.json.get("token")
        user = loggedInQuery(token)
        isAdmin = user.get("isAdmin") if user else False
        if not isAdmin:
            return abort(403)
        return func(token)

    return wrapper


def studentOnly(func):
    """Decorator to restrict access to student users only."""

    @wraps(func)  # Preserve the original function's metadata
    def wrapper():
        token = request.json.get("token")
        user = loggedInQuery(token)
        isAdmin = user.get("isAdmin") if user else False
        if isAdmin:
            return abort(403)
        stuId = user.get("username")
        return func(token, stuId)

    return wrapper


# Admin operations


@app.route("/api/admin/get", methods=["POST"])
@adminOnly
def adminGet(token):
    table = request.json.get("table")
    log(token, "AdminGet", table)
    result = fetchTable(session, table)
    return {"success": bool(result), "data": result}


@app.route("/api/admin/update", methods=["POST"])
@adminOnly
def adminUpdate(token):
    table = request.json.get("table")
    pkValues = request.json.get("pkValues")
    colIdx = request.json.get("colIdx")
    newValue = request.json.get("newValue")
    success = updateTable(session, table, pkValues, colIdx, newValue)
    if success:
        log(token, "AdminUpdate", table, pkValues, colIdx, newValue)
    return {"success": success}


@app.route("/api/admin/insert", methods=["POST"])
@adminOnly
def adminInsert(token):
    log(token, "AdminInsert", request.json)
    success, error = insertTable(session, **request.json)
    if success:
        log(token, "AdminInsert successful")
    else:
        log(token, "AdminInsert failed", error)
    return {"success": success, "error": error}


@app.route("/api/admin/delete", methods=["POST"])
@adminOnly
def adminDelete(token):
    table = request.json.get("table")
    pkValues = request.json.get("pkValues")
    success, error = deleteTable(session, table, pkValues)
    if success:
        log(token, "AdminDelete", table, pkValues)
    return {"success": success, "error": error}


@app.route("/api/admin/rename", methods=["POST"])
@adminOnly
def adminRename(token): # "Rename" primary key values
    log(token, "AdminRename", request.json)
    field = request.json.get("field")
    oldId = request.json.get("oldId")
    newId = request.json.get("newId")
    success, error = renamePK(session, field, oldId, newId)
    return {"success": success, "error": error, "field": field, "oldId": oldId, "newId": newId}

# Student operations


@app.route("/api/student/info", methods=["POST"])
@studentOnly
def studentInfo(token, stuId):
    log(token, "StudentInfo", stuId)
    result = getStuInfo(session, stuId)
    return {"success": bool(result), "data": result}


@app.route("/api/student/update", methods=["POST"])
@studentOnly
def studentUpdate(token, stuId):
    data = request.json
    log(token, "StudentUpdate", data)
    success = updateStuInfo(session, stuId, **data)
    return {"success": success}


@app.route("/api/student/courses", methods=["POST"])
@studentOnly
def studentCourses(token, stuId):
    log(token, "StudentCourses")
    result = fetchCourses(session)
    return {"success": bool(result), "data": result}


@app.route("/api/student/scores", methods=["POST"])
@studentOnly
def studentScores(token, stuId):
    log(token, "StudentScores")
    result = getStuScores(session, stuId)
    return {"success": bool(result), "data": result}


@app.route("/api/student/avg_score", methods=["POST"])
@studentOnly
def studentAvgScore(token, stuId):
    log(token, "StudentAvgScore")
    result = getStuAvgScore(session, stuId)
    return {"success": True, "data": result}


@app.route("/api/student/profile", methods=["POST"])
@studentOnly
def studentProfile(token, stuId):
    log(token, "StudentProfile", stuId)
    relPath = f"profile/{stuId}.jpg"
    if exists(join(CWD, relPath)):
        return send_from_directory(CWD, relPath)
    else:
        return send_from_directory(CWD, "profile/default.jpg")


@app.route("/api/student/upload", methods=["POST"])
def studentUpload():
    # This is a special case where we don't use the `@studentOnly` decorator
    # because we're using `multipart/form-data` instead of JSON
    token = request.form.get("token")
    user = loggedInQuery(token)
    if not user:
        return {"success": False, "error": "Not logged in"}
    isAdmin = user.get("isAdmin")
    if isAdmin:
        return {
            "success": False,
            "error": "Admins cannot upload profile pictures on behalf of students",
        }
    stuId = user.get("username")
    log(token, "StudentUpload", stuId)
    file = request.files.get("file")
    if not file:
        return {"success": False, "error": "No file uploaded"}
    relPath = f"profile/{stuId}.jpg"
    file.save(join(CWD, relPath))
    return {"success": True, "message": ""}


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
