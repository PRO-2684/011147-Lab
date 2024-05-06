from flask import Flask, send_from_directory, redirect
from os import getcwd
from argparse import ArgumentParser

app = Flask(__name__)
CWD = getcwd()

@app.route('/') # Redirect to `index.html`
def index():
    return redirect('/index.html')

@app.route('/<path:filename>') # Serve files from the current directory
def serve_file(filename):
    return send_from_directory(CWD, filename)

if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--port', type=int, default=5000)
    parser.add_argument('--debug', action='store_true')
    args = parser.parse_args()
    app.run(port=args.port, debug=args.debug)
