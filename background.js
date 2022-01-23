'use strict';
const debug = false;

/**
Listen to requests from content script
**/
let ports = [];
let portFromCS;
let portFromOS;
var MsgNotification = "encrypt-msg-notification";
var MsgNotificationTimer = "encrypt-msg-notification-timer";
var MsgNotificationAutoClearTime = 0.034; //cleanup after two seconds
let DEFAULTpasswordsize = 16;
let DEFAULTcomplexdomains = "";
let DEFAULThashalgo = "sha512";
//Settings for SCrypt
let DEFAULTcpu = "4096";
let DEFAULTmemory = "8";
let DEFAULTparallel = "1";
let DEFAULThashalgosize = "64";

browser.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name == MsgNotificationTimer) {
	if (debug) console.log("clean up the notification");
	browser.notifications.clear(MsgNotification);
	browser.alarms.clear(MsgNotificationTimer);	
  }
});

function connected(p) {
	/**
  if (p.name == "strongpassword-content-port") { port = portFromCS; }
  if (p.name == "strongpassword-option-port") { port = portFromOS; }
  
  **/
  if (debug) console.log(p.name);
  ports[p.name] = p;
  ports[p.name].postMessage({greeting: "Hello from background script!"});
  ports[p.name].onMessage.addListener(function(m) {
  /**portFromCS = p;
  portFromCS.postMessage({greeting: "Hello from background script!"});
  portFromCS.onMessage.addListener(function(m) {
	  **/
    if (debug) console.log("Background script received:" + m.greeting);
		if (m.greeting == "encrypt-success") {
			if (debug) console.log("opening notification");
			  var title = browser.i18n.getMessage("notificationTitle");
			  var content = browser.i18n.getMessage("notificationContentSuccess", "x");
			  browser.notifications.create(MsgNotification, {
				"type": "basic",
				"iconUrl": browser.extension.getURL("icons/link-48.png"),
				"title": title,
				"message": content
			  });
			  browser.alarms.create(MsgNotificationTimer, {delayInMinutes: MsgNotificationAutoClearTime});
		} else if (m.greeting == "encrypt-failed-null-value") {
			if (debug) console.log("opening notification");
			  var title = browser.i18n.getMessage("notificationTitle");
			  var content = browser.i18n.getMessage("notificationContentFailedNullValue", "x");
			  browser.notifications.create(MsgNotification, {
				"type": "basic",
				"iconUrl": browser.extension.getURL("icons/link-48.png"),
				"title": title,
				"message": content
			  });
			  browser.alarms.create(MsgNotificationTimer, {delayInMinutes: MsgNotificationAutoClearTime});
		} else if (m.greeting == "encrypt-failed-null-domain-value") {
			if (debug) console.log("opening notification");
			  var title = browser.i18n.getMessage("notificationTitle");
			  var content = browser.i18n.getMessage("notificationContentFailedNullDomainValue", "x");
			  browser.notifications.create(MsgNotification, {
				"type": "basic",
				"iconUrl": browser.extension.getURL("icons/link-48.png"),
				"title": title,
				"message": content
			  });
			  browser.alarms.create(MsgNotificationTimer, {delayInMinutes: MsgNotificationAutoClearTime});
		} else if (m.greeting == "encrypt-failed-invalid-domain-value") {
			if (debug) console.log("opening notification");
			  var title = browser.i18n.getMessage("notificationTitle");
			  var content = browser.i18n.getMessage("notificationContentFailedInvalidDomainValue", "x");
			  browser.notifications.create(MsgNotification, {
				"type": "basic",
				"iconUrl": browser.extension.getURL("icons/link-48.png"),
				"title": title,
				"message": content
			  });
			  browser.alarms.create(MsgNotificationTimer, {delayInMinutes: MsgNotificationAutoClearTime});
		} else if (m.greeting == "encrypt-password") {
			var passwordvalue = "";
			var domainvalue = "";
			var passwordsize = DEFAULTpasswordsize;
			var complexdomains = DEFAULTcomplexdomains;
			var hashalgo = DEFAULThashalgo;
			var cpu = DEFAULTcpu;
			var memory = DEFAULTmemory;
			var parallel = DEFAULTparallel;
			var hashalgosize = DEFAULThashalgosize;
			
			if (m.passwordvalue) passwordvalue = m.passwordvalue;
			if (m.domainvalue) domainvalue = m.domainvalue;
			
			//get configuration
			var getConfigurationItem = browser.storage.local.get({
			  passwordsize: DEFAULTpasswordsize,
			  complexdomains: DEFAULTcomplexdomains,
			  hashalgo: DEFAULThashalgo,
			  cpu: DEFAULTcpu,
			  memory: DEFAULTmemory,
			  parallel: DEFAULTparallel,
			  hashalgosize: DEFAULThashalgosize
			});
			
			getConfigurationItem.then((res) => {
				//set variables
				if (debug) console.log(res);
				passwordsize = res.passwordsize;
				if (m.passwordsize) passwordsize = m.passwordsize;
				complexdomains = res.complexdomains;
				if (m.complexdomains) complexdomains = m.complexdomains;
				hashalgo = res.hashalgo;
				if (m.hashalgo) hashalgo = m.hashalgo;
				cpu = res.cpu;
				if (m.cpu) cpu = m.cpu;
				memory = res.memory;
				if (m.memory) memory = m.memory;
				parallel = res.parallel;
				if (m.parallel) parallel = m.parallel;
				hashalgosize = res.hashalgosize;
				if (m.hashalgosize) hashalgosize = m.hashalgosize;
				
				//get tld
				var hostname = tldjs.getDomain(domainvalue);
				
				//error handling
				if (passwordvalue == "") {
					if (debug) console.log("NULL password value" );
					ports[m.port].postMessage({greeting: "encrypt-failed-null-value"});
				} else if (domainvalue == "") {
					if (debug) console.log("NULL domain value" );
					ports[m.port].postMessage({greeting: "encrypt-failed-null-domain-value"});
				} else if (hostname === null) {
					//invalid hostname
					if (debug) console.log("NULL hostname value" );
					ports[m.port].postMessage({greeting: "encrypt-failed-domain-value"});
				} else {
					//derive a password
					if (debug) console.log("Hostname: " + hostname);
					if (debug) console.log("Using algo: "+ hashalgo);
					switch(hashalgo) {
					  case "sha256":
						var newHMAC = CryptoJS.HmacSHA256(hostname, passwordvalue);
						var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
						break;
					  case "sha384":
						var newHMAC = CryptoJS.HmacSHA384(hostname, passwordvalue);
						var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
						break;
					  case "sha3":
						var newHMAC = CryptoJS.HmacSHA3(hostname, passwordvalue);
						var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
						break;
					  case "scrypt":
						var enc = new TextEncoder(); // always utf-8
						var passwordvalueenc = enc.encode(passwordvalue);
						var hostnameenc = enc.encode(hostname);
						var scryptarr = scrypt.syncScrypt(passwordvalueenc, hostnameenc, parseInt(cpu), parseInt(memory), parseInt(parallel), parseInt(hashalgosize));
						
						var dec = new TextDecoder(); // always utf-8
						var base64String = btoa(String.fromCharCode.apply(null, scryptarr));
						
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
						break;
					  default:
						var newHMAC = CryptoJS.HmacSHA512(hostname, passwordvalue);
						var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
					} //end switch
				} //end derive password	
			}); //end getconfiguration
		}; //end parse greeting
  }); //end added listener
}

/**
Have to split this part due to async argon2
**/
function continueEncryptPassword(finalBase64String, hostname, complexdomains, port) {
	if (debug) console.log(finalBase64String);
	
	//process domains that have complexity requirements
	var arr = complexdomains.split("\n");
	if (debug) console.log(arr.length + " saved complex domains found");
	for (var i = 0; i < arr.length; i++)
	{
		var thisdomain = arr[i].split(" ");
		if (thisdomain[0] == hostname) {
			if (debug) console.log("complex domain matched");
			finalBase64String = finalBase64String + thisdomain[1];
		}
	}
	
	//send back the derivative
	if (debug) console.log("encrypt-success");
	ports[port].postMessage({greeting: "encrypt-success", derivative: finalBase64String});
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
		if (debug) console.log("encrypting password");
		ports["strongpassword-content-port"].postMessage({greeting: "encrypt-password"});
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
    if (debug) console.log(command);
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
	ports["strongpassword-content-port"].postMessage({greeting: "encrypt-password"});
});
