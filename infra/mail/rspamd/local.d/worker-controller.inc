# Web UI and the learn/stat interface. Bound to localhost: reach it over an SSH
# tunnel (ssh -L 11334:127.0.0.1:11334 mail-host) rather than exposing it.
bind_socket = "127.0.0.1:11334";
secure_ip = "127.0.0.1";
password = "__RSPAMD_CONTROLLER_PASSWORD__";
enable_password = "__RSPAMD_CONTROLLER_PASSWORD__";
