'use strict';
const debug = false;

let myPort = browser.runtime.connect({name:"strongpassword-content-port"});
myPort.postMessage({greeting: "Hello from content script"});
var replyPort;
/**
Listen to messges from background script
When message received, encrypt the password
**/
myPort.onMessage.addListener(function(m) {
    if (debug) console.log("Received from background script: " + m.greeting);
	
	switch(m.greeting) {
		case "register-replyport":
			if (debug) console.log("Registering reply port: " + m.replyPort);	
			replyPort = m.replyPort;
		break;
		case "encrypt-password":
			var inputfield = window.document.activeElement;
			if (inputfield.type) {
				if (inputfield.type.toLowerCase() === "password") {
					myPort.postMessage({greeting: "encrypt-password", port: replyPort,
						domainvalue: tldjs.getDomain(window.location.hostname), 
						passwordvalue: inputfield.value
						});
				}
			}
		break;
		case "encrypt-success":
			var inputfield = window.document.activeElement;
			if (m.derivative) {
				if (inputfield.type) {
					if (inputfield.type.toLowerCase() === "password") {
					  inputfield.value = m.derivative;
					  myPort.postMessage({greeting: "encrypt-success", port: replyPort});
					}
				}
			}
		break;
		case "encrypt-failed-null-value":
			myPort.postMessage({greeting: "encrypt-failed-null-value", port: replyPort});
		break;
	}
});
