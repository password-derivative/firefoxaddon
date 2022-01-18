# Password Derivation Extension
Protect your passwords by ensuring none of them are the same. This addon helps to convert your password to a domain-based unique derivative, using non-reversible hash encryption. 

The passwords are not stored anywhere and no state is kept. The default hash function used is HTML_SAFE_BASE64(HMAC512(password, domain)).

# Usage
Type your password in the password field and then either:
	- Right click in a password field and choose 'Encrypt password'
	- Press Ctrl+Space (Command+Space on a Mac) while in the password field.

You can customize the following in options:
	- The hash algorithm used
	- The desired size of the derivative
	- The hotkey used to convert the password
	- and more ...

# Permission usage
Display notifications to you: it uses notifications to show when the actions was succesfull or failed.
Access your data for all websites: the program has to read the password field to calculate the derivative.

Other technical permissions:
Alarms: It uses alarms to clean up the notification in 2 seconds.
ContextMenus: To add the 'Encrypt password' option
Storage: To store the settings of the addon locally in your browser

# Future music
To supply stronger hashing, I might want to implement this one later on:
https://github.com/antelle/argon2-browser
Current challenge is that it requires a C module.