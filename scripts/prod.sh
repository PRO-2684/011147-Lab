# Start MySQL service if not already running
if ! systemctl is-active --quiet mysql; then
  sudo systemctl start mysql
fi
python3 app.py
