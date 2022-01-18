'use strict';

/**
Listen to requests from content script
**/
let portFromCS;
var MsgNotification = "encrypt-msg-notification";
var MsgNotificationTimer = "encrypt-msg-notification-timer";
var MsgNotificationAutoClearTime = 0.034; //cleanup after two seconds
let DEFAULTpasswordsize = 16;
let DEFAULTcomplexdomains = "";
let DEFAULThashalgo = "sha512";

browser.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name == MsgNotificationTimer) {
	console.log("clean up the notification");
	browser.notifications.clear(MsgNotification);
	browser.alarms.clear(MsgNotificationTimer);	
  }
});

function connected(p) {
  portFromCS = p;
  portFromCS.postMessage({greeting: "Hello from background script!"});
  portFromCS.onMessage.addListener(function(m) {
    console.log("Background script received:" + m.greeting);
	
	if (m.greeting == "encrypt-success") {
		console.log("opening notification");
		  var title = browser.i18n.getMessage("notificationTitle");
		  var content = browser.i18n.getMessage("notificationContentSuccess", "x");
		  browser.notifications.create(MsgNotification, {
			"type": "basic",
			"iconUrl": browser.extension.getURL("icons/link-48.png"),
			"title": title,
			"message": content
		  });
		  browser.alarms.create(MsgNotificationTimer, {delayInMinutes: MsgNotificationAutoClearTime});
	}
	if (m.greeting == "encrypt-failed-null-value") {
		console.log("opening notification");
		  var title = browser.i18n.getMessage("notificationTitle");
		  var content = browser.i18n.getMessage("notificationContentFailedNullValue", "x");
		  browser.notifications.create(MsgNotification, {
			"type": "basic",
			"iconUrl": browser.extension.getURL("icons/link-48.png"),
			"title": title,
			"message": content
		  });
		  browser.alarms.create(MsgNotificationTimer, {delayInMinutes: MsgNotificationAutoClearTime});
	}
	if (m.greeting == "encrypt-password") {
		var passwordvalue = "";
		var domainvalue = "";
		var passwordsize = DEFAULTpasswordsize;
		var complexdomains = DEFAULTcomplexdomains;
		var hashalgo = DEFAULThashalgo;
		
		if (m.passwordvalue) passwordvalue = m.passwordvalue;
		if (m.domainvalue) domainvalue = m.domainvalue;
		var passwordSizeItem = browser.storage.local.get('passwordsize');
		passwordSizeItem.then((res) => {
			passwordsize = res.passwordsize || DEFAULTpasswordsize;	
			if (m.passwordsize) passwordsize = m.passwordsize;
			
			var complexdomainsItem = browser.storage.local.get('complexdomains');
			complexdomainsItem.then((res) => {
				complexdomains = res.complexdomains || DEFAULTcomplexdomains;
				if (m.complexdomains) complexdomains = m.complexdomains;
				
				var hashalgoItem = browser.storage.local.get('hashalgo');
				hashalgoItem.then((res) => {
					hashalgo = res.hashalgo || DEFAULThashalgo;
					if (m.hashalgo) hashalgo = m.hashalgo;

					if (passwordvalue == "") {
						console.log("NULL password value" );
						portFromCS.postMessage({greeting: "encrypt-failed-null-value"});
					} else if (domainvalue == "") {
						console.log("NULL domain value" );
						portFromCS.postMessage({greeting: "encrypt-failed-null-value"});
					} else {
						var hostname = tldjs.getDomain(domainvalue);
						if (hostname === null) {
							//invalid hostname
							console.log("NULL hostname value" );
							portFromCS.postMessage({greeting: "encrypt-failed-null-value"});
						} else {
							console.log("Hostname: " + hostname);
							
							//derive a password
							console.log("Using algo: "+ hashalgo);
							switch(hashalgo) {
							  case "sha256":
								var newHMAC = CryptoJS.HmacSHA256(hostname, passwordvalue);
								break;
							  case "sha384":
								var newHMAC = CryptoJS.HmacSHA384(hostname, passwordvalue);
								break;
							  case "sha3":
								var newHMAC = CryptoJS.HmacSHA3(hostname, passwordvalue);
								break;
							  default:
								var newHMAC = CryptoJS.HmacSHA512(hostname, passwordvalue);
							} 
							var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
							var finalBase64String = base64String.slice(0, passwordsize);
							console.log(newHMAC.toString());
							console.log(base64String);
							console.log(finalBase64String);
							
							//process domains that have complexity requirements
							var arr = complexdomains.split("\n");
							console.log(arr.length + " saved complex domains found");
							for (var i = 0; i < arr.length; i++)
							{
								var thisdomain = arr[i].split(" ");
								if (thisdomain[0] == hostname) {
									console.log("complex domain matched");
									finalBase64String = finalBase64String + thisdomain[1];
								}
							}
							
							//send back the derivative
							console.log("encrypt-success");
							portFromCS.postMessage({greeting: "encrypt-success", derivative: finalBase64String});
						}
					}
				});
			});
		});
	}
  });
}

browser.runtime.onConnect.addListener(connected);

/**
Create a context menu for password fields
**/
browser.contextMenus.create({
    id: "encrypt-password",
    title: "Encrypt password",
    contexts: ["password"],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "encrypt-password") {
		console.log("encrypting password");
		portFromCS.postMessage({greeting: "encrypt-password"});
	}
});

/**
 * Returns all of the registered extension commands for this extension
 * and their shortcut (if active).
 *
 * Since there is only one registered command in this sample extension,
 * the returned `commandsArray` will look like the following:
 *    [{
 *       name: "toggle-feature",
 *       description: "Send a 'toggle-feature' event to the extension"
 *       shortcut: "Ctrl+Shift+1"
 *    }]
 */
 
let gettingAllCommands = browser.commands.getAll();
gettingAllCommands.then((commands) => {
  for (let command of commands) {
    // Note that this logs to the Add-on Debugger's console: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Debugging
    // not the regular Web console.
    console.log(command);
  }
});

/**
 * Fired when a registered command is activated using a keyboard shortcut.
 *
 * In this sample extension, there is only one registered command: "Ctrl+Shift+1".
 * On Mac, this command will automatically be converted to "Command+Shift+1".
 */
 
//debug via about:debugging
browser.commands.onCommand.addListener((command) => {
		portFromCS.postMessage({greeting: "encrypt-password"});
});