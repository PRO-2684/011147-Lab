# Start MySQL service if not already running
# if ! systemctl is-active --quiet mysql; then
#   sudo systemctl start mysql
# fi
python3 app.py --debug
# Stop MySQL service on exit
if systemctl is-active --quiet mysql; then
  sudo systemctl stop mysql
fi
