# Milter endpoint. Postfix connects here (smtpd_milters in main.cf) and Rspamd
# both scores the message and signs it on the way out.
bind_socket = "127.0.0.1:11332";
milter = yes;
timeout = 120s;
upstream "local" {
  default = yes;
  self_scan = yes;
}
count = 4;
max_retries = 5;

# Reject outright rather than quarantining. Nobody reads a quarantine, and a
# message held in one is indistinguishable to the sender from a message lost.
discard_on_reject = false;
quarantine_on_reject = false;
reject_message = "Message rejected: scored as spam";
