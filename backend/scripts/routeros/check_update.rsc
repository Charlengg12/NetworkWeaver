# Check for RouterOS updates
/system package update check-for-updates
:delay 1s
:local channel [/system package update get channel]
:local installed [/system package update get installed-version]
:local latest [/system package update get latest-version]

:put "Channel: $channel"
:put "Installed: $installed"
:put "Latest: $latest"

:if ($installed = $latest) do={
    :put "System is up to date."
} else={
    :put "New version available! Use /system package update install to upgrade."
}
