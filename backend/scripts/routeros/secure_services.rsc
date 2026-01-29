# Secure Services (Disable insecure protocols)
:put "Securing services..."
/ip service disable telnet
/ip service disable ftp
/ip service disable www
/ip service enable ssh
/ip service set ssh port=2222
:put "Telnet, FTP, WWW disabled. SSH moved to port 2222."
