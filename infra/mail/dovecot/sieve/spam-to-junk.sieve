# Runs after the user's own rules (sieve_after), so a personal rule that files
# a newsletter still wins.
#
# Rspamd's verdict arrives as a header; this only moves the message. Nothing is
# deleted: a filter that silently destroys mail is indistinguishable from a
# broken mail server, and the person who loses an order confirmation will not
# accept "the spam filter was confident" as an answer.
require ["fileinto", "mailbox"];

if anyof (
  header :contains "X-Spam" "Yes",
  header :contains "X-Spamd-Result" "default: True"
) {
  fileinto :create "Junk";
  stop;
}
