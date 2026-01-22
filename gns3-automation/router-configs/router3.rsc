# MikroTik Router 3 Configuration Script
# Usage: Copy and paste into RouterOS terminal or import via /import command

# System Configuration
/system identity set name=Router3
/system clock set time-zone-name=Asia/Singapore

# Interface Configuration
/ip address add address=192.168.100.12/24 interface=ether1 comment="Management Interface"
/ip address add address=10.3.1.1/24 interface=ether3 comment="LAN Interface"

# WAN Interface (DHCP Client)
/ip dhcp-client add interface=ether2 disabled=no comment="WAN Interface"

# DHCP Server for LAN
/ip pool add name=lan-pool ranges=10.3.1.100-10.3.1.200
/ip dhcp-server network add address=10.3.1.0/24 gateway=10.3.1.1 dns-server=8.8.8.8,8.8.4.4
/ip dhcp-server add name=lan-dhcp interface=ether3 address-pool=lan-pool disabled=no

# NAT Configuration
/ip firewall nat add chain=srcnat out-interface=ether2 action=masquerade comment="Internet NAT"

# Firewall Rules
/ip firewall filter add chain=input action=accept connection-state=established,related comment="Accept established/related"
/ip firewall filter add chain=input action=accept protocol=icmp comment="Accept ICMP"
/ip firewall filter add chain=input action=accept in-interface=ether1 comment="Accept from Management"
/ip firewall filter add chain=input action=drop comment="Drop all other input"

# API Configuration
/ip service set api address=192.168.100.0/24 disabled=no
/ip service set api-ssl disabled=yes
/ip service set ssh port=22 disabled=no
/ip service set telnet disabled=yes
/ip service set ftp disabled=yes
/ip service set www disabled=no address=192.168.100.0/24

# User Management
/user add name=apiuser password=apipass123 group=full comment="NetworkWeaver API User"

# SNMP Configuration
/snmp set enabled=yes contact="admin@networkweaver.local" location="GNS3-Lab-Site3"
/snmp community add name=public addresses=192.168.100.0/24 read-access=yes write-access=no

# DNS Configuration
/ip dns set servers=8.8.8.8,8.8.4.4 allow-remote-requests=yes

# NTP Configuration
/system ntp client set enabled=yes primary-ntp=pool.ntp.org

# Logging
/system logging add topics=info,!debug action=memory

# Save configuration
/system backup save name=router3-initial
