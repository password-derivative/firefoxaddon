Protect your passwords by ensuring none of them are the same. If your password is affected by a data breach on one website, only one leaks.
This addon helps ensure that every password used is unique by deriving a password from the password entered using non-reversible hash encryption: HTML_SAFE_BASE64(HMAC512(password, domain)). 

Usage: Right click in a password field and choose 'Encrypt password', or press Ctrl+Space (Command+Space on a Mac).",

It uses notifications to show when the actions was succesfull or failed.
It uses alarms to clean up the notification in 2 seconds.

It also adds an options page to the extension, which enables the user to change the registered shortcut for the extension. 
Just open the options page, then type a new value into the textbox (for example: "Ctrl+Shift+O") and press "Update keyboard shortcut". To reset the shortcut to its original value, press "Reset keyboard shortcut".

To supply stronger hashing, I might want to implement this one later on:
https://github.com/antelle/argon2-browser
Current challenge is that it requires a C module.