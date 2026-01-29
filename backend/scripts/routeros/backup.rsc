# Create System Backup
:put "Creating system backup..."
:local filename "manual_backup"
/system backup save name=$filename
:put "Backup created: $filename.backup"
:put "You can download it via Files menu."
