from flask import Flask, send_from_directory, redirect, abort, request
from os import getcwd
from argparse import ArgumentParser

app = Flask(__name__)
CWD = getcwd()
WEB_ALLOWED_PATHS = ["index.html", "static", "favicon.ico"]

@app.route("/")  # Redirect to `index.html`
def index():
    return redirect("/index.html")


@app.route("/api")  # API endpoint
def api():
    return "API endpoint"


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
