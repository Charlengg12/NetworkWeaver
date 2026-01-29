# Enable SNMP (Community: public)
:put "Enabling SNMP..."
/snmp set enabled=yes trap-version=2
/snmp community set [find default=yes] name="public" addresses=0.0.0.0/0 read-access=yes
:put "SNMP enabled with community 'public'."
