from flask import Flask, send_from_directory, redirect, abort, request
from utils import initConnection, queryAdmin, queryStudent, loginUser, logoutUser, loggedInQuery
from os import getcwd
from argparse import ArgumentParser

session = initConnection()
if not session:
    print("Cannot establish connection to the database.")
    exit(1)
app = Flask(__name__)
CWD = getcwd()
WEB_ALLOWED_PATHS = ["index.html", "admin.html", "student.html", "static", "favicon.ico"]

@app.route("/")  # Redirect to `index.html`
def index():
    return redirect("/index.html")


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if not data:
        return abort(400)
    username = data.get("username")
    password = data.get("password")
    isAdmin = bool(data.get("is_admin", False))
    print(f'{"Admin" if isAdmin else "Student"} login attempt: "{username}" "{password}"')
    if isAdmin:
        data = queryAdmin(session, username, password)
    else:
        data = queryStudent(session, username, password)
    success = bool(data)
    return {"success": success, "isAdmin": isAdmin, "data": data, "token": loginUser(username, password, isAdmin) if success else ""}


@app.route("/api/logout", methods=["POST"])
def logout():
    token = request.json.get("token")
    print(f'Logout attempt: "{token}"')
    return {"success": logoutUser(token)}


@app.route("/<path:filename>")  # Serve files from the current directory
def serve_file(filename: str):
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
