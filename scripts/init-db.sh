# Connect to MySQL database
if ! systemctl is-active --quiet mysql; then
  sudo systemctl start mysql
fi
# Read username and password from config.json
user=$(jq -r '.user' config.json)
password=$(jq -r '.password' config.json)
mysql -u $user -p$password < backend/create-db.sql
