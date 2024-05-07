# Connect to MySQL database
# Read username and password from config.json
user=$(jq -r '.user' config.json)
password=$(jq -r '.password' config.json)
mysql -u $user -p$password
