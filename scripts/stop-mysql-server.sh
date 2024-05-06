# Run `systemctl stop mysql` if service running
if systemctl is-active --quiet mysql; then
  sudo systemctl stop mysql
fi
