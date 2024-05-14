if systemctl is-active --quiet mysql; then
    sudo systemctl stop mysql
fi
