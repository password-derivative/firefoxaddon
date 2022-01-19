# Password Derivation Extension
Protect your passwords by ensuring none of them are the same. This addon helps to convert your password to a domain-based unique derivative, using non-reversible hash encryption. 

The passwords are not stored anywhere and no state is kept.

The default hash function used is:
```
HTML_SAFE_BASE64(HMAC512(password, domain)).substring(0,16)
```

# Usage
Type your password in the password field and then either:
- Right click in a password field and choose 'Encrypt password'.
- Press Ctrl+Space (Command+Space on a Mac) while in the password field.

You can customize the following in options:
- The hash algorithm used.
- The desired size of the derivative.
- The hotkey used to convert the password.
- and more ...

# Permission usage
- **Display notifications to you**: it uses notifications to show when the action was succesfull or failed.
- **Access your data for all websites**: the program has to read the password field to calculate the derivative.

Other technical permissions:
- Alarms: It uses alarms to clean up the notification in 2 seconds.
- ContextMenus: To add the 'Encrypt password' option.
- Storage: To store the settings of the addon locally in your browser.

# Libraries
- argon2-browser from NPM (v1.18.0)
- CryptoJS from code.google.com (v3.1.2)
- tldjs from NPM (v2.1.0)

# Future music
Will investigate if more hash algorithms can be added, such as:
- Blake2
- Blake2b
- Blake3
- .. ?


Rejected Argon2 implementation for now, because it seems to be platform dependend.
- https://github.com/antelle/argon2-browser