'use strict';
const debug = false;

/**
Listen to requests from content script
**/
let port = [];
var MsgNotification = "encrypt-msg-notification";
var MsgNotificationTimer = "encrypt-msg-notification-timer";
var MsgNotificationAutoClearTime = 0.034; //cleanup after two seconds
let DEFAULTrightclickmenu = "alwaysdisplay";
let DEFAULTpasswordsalt = "";
let DEFAULTdomainsalt = "";
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

/**
 To convert numbers in a WordArray to String
 **/
var toBytesInt32=function(num) {
    var ascii='';
    for (let i=3;i>=0;i--) {
		//ascii+=((num>>(8*i))&255);
		//ascii+="|";
        ascii+=String.fromCharCode((num>>(8*i))&255);
    }
    return ascii;
};

/**
 To convert an entire WordArray to String
 **/
var wordArrayToBytesInt32=function(wordarray) {
    var ascii='';
	
	wordarray.words.forEach(function (item, index) {
		ascii+=toBytesInt32(item);
	});
		
    return ascii;
};

/**
 To convert Strings to numbers in a WordArray
 **/
var fromBytesInt32=function(numString) {
    var result=0;
    for (let i=3;i>=0;i--) {
        result+=numString.charCodeAt(3-i)<<(8*i);
    }
    return result;
};

function connected(p) {
   /**
  (p.name == "strongpassword-option-port") 
  (p.name == "strongpassword-content-port") 
  (p.name == "strongpassword-content-port0") 
  **/
  if (debug) console.log(p);
  if (debug) console.log("port"+p.sender.tab.id + " assigned to "+ p.sender.url);
  port["port"+p.sender.tab.id] = p;
  port["port"+p.sender.tab.id].postMessage({greeting: "register-replyport", replyPort: "port"+p.sender.tab.id});
  port["port"+p.sender.tab.id].onMessage.addListener(function(m) {
    if (debug) console.log("Background script received:" + m.greeting);
		if (m.greeting == "encrypt-success") {
			if (debug) console.log("opening notification");
			  var title = browser.i18n.getMessage("notificationTitle");
			  var content = browser.i18n.getMessage("notificationContentSuccess", "x");
			  browser.notifications.create(MsgNotification, {
				"type": "basic",
				"iconUrl": browser.runtime.getURL("icons/link-48.png"),
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
				"iconUrl": browser.runtime.getURL("icons/link-48.png"),
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
				"iconUrl": browser.runtime.getURL("icons/link-48.png"),
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
				"iconUrl": browser.runtime.getURL("icons/link-48.png"),
				"title": title,
				"message": content
			  });
			  browser.alarms.create(MsgNotificationTimer, {delayInMinutes: MsgNotificationAutoClearTime});
		} else if (m.greeting == "random-bytes") {
			if (debug) console.log(m.amount +" random bytes for "+ m.field);
			var randomByteArray = CryptoJS.lib.WordArray.random(m.amount);
			var randomByteString = CryptoJS.enc.Base64.stringify(randomByteArray);
			if (debug) console.log(randomByteString);
			port[m.port].postMessage({greeting: "random-bytes-success", randomByteString: randomByteString, field: m.field});
		} else if (m.greeting == "encrypt-password") {
			var passwordvalue = "";
			var domainvalue = "";
			var passwordsalt = "";
			var domainsalt = "";
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
			  passwordsalt: DEFAULTpasswordsalt,
			  domainsalt: DEFAULTdomainsalt,
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
				hashalgo = res.hashalgo;
				if (m.hashalgo) hashalgo = m.hashalgo;
				complexdomains = res.complexdomains;
				if (m.complexdomains) complexdomains = m.complexdomains;
				passwordsalt = res.passwordsalt;
				if (m.passwordsalt) passwordsalt = m.passwordsalt;
				domainsalt = res.domainsalt;
				if (m.domainsalt) domainsalt = m.domainsalt;
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
				
				//set salted variables
				var passwordsaltWordArray = CryptoJS.enc.Base64.parse(passwordsalt);
				var domainsaltWordArray = CryptoJS.enc.Base64.parse(domainsalt);
				var saltedpasswordvalue = wordArrayToBytesInt32(passwordsaltWordArray) + passwordvalue;
				var saltedhostnamevalue = wordArrayToBytesInt32(domainsaltWordArray) + hostname;
				
				//if (debug) console.log("saltedpassword value: "+ saltedpasswordvalue);
				//if (debug) console.log("saltedhostname value: "+ saltedhostnamevalue);
				
				//error handling
				if (passwordvalue == "") {
					if (debug) console.log("NULL password value" );
					port[m.port].postMessage({greeting: "encrypt-failed-null-value"});
				} else if (domainvalue == "") {
					if (debug) console.log("NULL domain value" );
					port[m.port].postMessage({greeting: "encrypt-failed-null-domain-value"});
				} else if (hostname === null) {
					//invalid hostname
					if (debug) console.log("NULL hostname value" );
					port[m.port].postMessage({greeting: "encrypt-failed-domain-value"});
				} else {
					//derive a password
					if (debug) console.log("Hostname: " + hostname);
					if (debug) console.log("Using algo: "+ hashalgo);
					switch(hashalgo) {
					  case "sha256":
						var newHMAC = CryptoJS.HmacSHA256(saltedhostnamevalue, saltedpasswordvalue);
						var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
						break;
					  case "sha384":
						var newHMAC = CryptoJS.HmacSHA384(saltedhostnamevalue, saltedpasswordvalue);
						var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
						break;
					  case "sha3":
						var newHMAC = CryptoJS.HmacSHA3(saltedhostnamevalue, saltedpasswordvalue);
						var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
						break;
					  case "scrypt":
						var enc = new TextEncoder(); // always utf-8
						var passwordvalueenc = enc.encode(saltedpasswordvalue);
						var hostnameenc = enc.encode(saltedhostnamevalue);
						var scryptarr = scrypt.syncScrypt(passwordvalueenc, hostnameenc, parseInt(cpu), parseInt(memory), parseInt(parallel), parseInt(hashalgosize));
						
						var dec = new TextDecoder(); // always utf-8
						var base64String = btoa(String.fromCharCode.apply(null, scryptarr));
						
						var finalBase64String = base64String.slice(0, passwordsize);
						continueEncryptPassword(finalBase64String, hostname, complexdomains, m.port);
						break;
					  default:
						var newHMAC = CryptoJS.HmacSHA512(saltedhostnamevalue, saltedpasswordvalue);
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
function continueEncryptPassword(finalBase64String, hostname, complexdomains, replyPort) {
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
	port[replyPort].postMessage({greeting: "encrypt-success", derivative: finalBase64String});
}


browser.runtime.onConnect.addListener(connected);

var getConfigurationItem = browser.storage.local.get({
			  rightclickmenu: DEFAULTrightclickmenu
			});
			
getConfigurationItem.then((res) => {
		if (res.rightclickmenu == "alwaysdisplay") {
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
					if (debug) console.log("encrypting password via menu");
					var gettingCurrent = browser.tabs.query({active: true});
					if (debug) console.log(gettingCurrent);
					gettingCurrent.then((res) => {
						if (debug) console.log(res[0]);
						port["port"+res[0].id].postMessage({greeting: "encrypt-password"});
					});
				}
			});
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
	if (debug) console.log("encrypting password via shortcut");
	var gettingCurrent = browser.tabs.query({active: true});
	if (debug) console.log(gettingCurrent);
	gettingCurrent.then((res) => {
		if (debug) console.log(res[0]);
		try { port["port"+res[0].id].postMessage({greeting: "encrypt-password"}); }
		catch (_) {
			if (debug) console.log("opening notification");
			var title = browser.i18n.getMessage("notificationTitle");
			var content = browser.i18n.getMessage("notificationContentShortcutFailedToFindContentPort", "x");
			browser.notifications.create(MsgNotification, {
				"type": "basic",
				"iconUrl": browser.runtime.getURL("icons/link-48.png"),
				"title": title,
				"message": content
			});
			browser.alarms.create(MsgNotificationTimer, {delayInMinutes: MsgNotificationAutoClearTime});
		}
	});
});

