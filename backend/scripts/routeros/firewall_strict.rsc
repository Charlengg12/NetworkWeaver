# Strict Firewall Template
# Enhanced protection with address lists and rate limiting

/ip firewall filter
add action=accept chain=input comment="defconf: accept established,related,untracked" connection-state=established,related,untracked
add action=drop chain=input comment="defconf: drop invalid" connection-state=invalid
add action=add-src-to-address-list address-list=Syn_Flooder address-list-timeout=30m chain=input comment="Add Syn Flood IP to the list" connection-limit=30,32 protocol=tcp tcp-flags=syn
add action=drop chain=input comment="Drop to syn flood list" src-address-list=Syn_Flooder
add action=add-src-to-address-list address-list=Port_Scanner address-list-timeout=1w chain=input comment="Port Scanner Detect" protocol=tcp psd=21,3s,3,1
add action=drop chain=input comment="Drop to port scanner list" src-address-list=Port_Scanner
add action=drop chain=input comment="defconf: drop all not coming from LAN" in-interface-list=!LAN

/log info "Strict Firewall Rules Applied"
