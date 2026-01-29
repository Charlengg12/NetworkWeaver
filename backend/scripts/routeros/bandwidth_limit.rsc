# NetworkWeaver Bandwidth Limit Template
# ======================================
# Applies QoS bandwidth limiting to a specific IP address
#
# Parameters:
#   TARGET_IP    - IP address to limit (e.g., 192.168.137.100)
#   MAX_UPLOAD   - Maximum upload speed (e.g., 5M, 10M)
#   MAX_DOWNLOAD - Maximum download speed (e.g., 10M, 50M)
#
# Usage via API:
#   POST /config/deploy
#   {
#     "device_id": 1,
#     "template_name": "bandwidth_limit",
#     "params": {"target_ip": "192.168.137.100", "max_upload": "5M", "max_download": "10M"}
#   }

/queue simple add name="nw_limit_$TARGET_IP" target=$TARGET_IP max-limit=$MAX_UPLOAD/$MAX_DOWNLOAD comment="NetworkWeaver Bandwidth Limit"
