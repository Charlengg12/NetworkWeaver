# Basic Networking Template
# Applies standard IP, DNS, and DHCP configurations

:local wanInterface "ether1"
:local lanInterface "ether2"
:local lanIP "192.168.88.1/24"
:local dnsServers "8.8.8.8,1.1.1.1"

/log info "Starting Basic Networking Template Application..."

# 1. Configure LAN IP
/ip address add address=$lanIP interface=$lanInterface comment="LAN-Interface"

# 2. Configure DNS
/ip dns set servers=$dnsServers allow-remote-requests=yes

# 3. Setup DHCP Server
/ip pool add name=dhcp_pool0 ranges=192.168.88.10-192.168.88.254
/ip dhcp-server add address-pool=dhcp_pool0 disabled=no interface=$lanInterface name=server1
/ip dhcp-server network add address=192.168.88.0/24 dns-server=$dnsServers gateway=192.168.88.1

/log info "Basic Networking Template Applied Successfully."
