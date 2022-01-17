'use strict';

/**
Listen to requests from content script
**/
let portFromCS;
var MsgNotification = "encrypt-msg-notification";
var MsgNotificationTimer = "encrypt-msg-notification-timer";
var MsgNotificationAutoClearTime = 0.034; //cleanup after two seconds

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
    console.log("Received from content script:" + m.greeting);
	
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
	  //get default password sizeToContent
	  var passwordSizeItem = browser.storage.local.get('passwordsize');
	  var passwordsize = 16;
	  passwordSizeItem.then((res) => {
		passwordsize = res.passwordsize || 16;
		portFromCS.postMessage({greeting: "encrypt-password"});
	  });
});