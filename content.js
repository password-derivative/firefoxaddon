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

/**
 Inline "encrypt" icon inside password fields, similar to the browser's
 own built-in "show password" eye icon. This lets people trigger
 encryption with a single tap right on the field, without needing the
 right-click menu, keyboard shortcut, or toolbar button - which matters
 most on touch devices (Firefox for Android) where the first two don't
 exist at all.
 **/
(function () {
	const ICON_ATTR = "data-pwderiv-icon-attached";
	const SIZE = 18;
	// Rough allowance so we don't sit on top of the browser's own native
	// "show password" eye icon, which is drawn by the browser itself and
	// isn't something a content script can measure directly.
	const NATIVE_ICON_ALLOWANCE = 26;

	const tracked = new Map(); // password field -> our injected icon element

	function isPasswordField(field) {
		return field && field.tagName === "INPUT" && field.type &&
			field.type.toLowerCase() === "password";
	}

	function encryptField(field) {
		myPort.postMessage({
			greeting: "encrypt-password",
			port: replyPort,
			domainvalue: tldjs.getDomain(window.location.hostname),
			passwordvalue: field.value
		});
	}

	function makeIcon(field) {
		const icon = document.createElement("div");
		icon.setAttribute("data-pwderiv-icon", "true");
		icon.title = browser.i18n.getMessage("inlineIconTitle") || "Encrypt password";
		icon.style.position = "absolute";
		icon.style.width = SIZE + "px";
		icon.style.height = SIZE + "px";
		icon.style.cursor = "pointer";
		icon.style.zIndex = "2147483647";
		icon.style.backgroundImage = "url(" + browser.runtime.getURL("icons/link-48.png") + ")";
		icon.style.backgroundSize = "contain";
		icon.style.backgroundRepeat = "no-repeat";
		icon.style.backgroundPosition = "center";
		icon.style.opacity = "0.75";
		icon.style.pointerEvents = "auto";

		icon.addEventListener("mouseenter", () => { icon.style.opacity = "1"; });
		icon.addEventListener("mouseleave", () => { icon.style.opacity = "0.75"; });

		// Keep focus on the password field itself when the icon is tapped,
		// so document.activeElement stays the field (the encrypt flow
		// relies on that) instead of jumping to the icon.
		icon.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
		icon.addEventListener("touchstart", (e) => {
			e.preventDefault();
		}, {passive: false});
		icon.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			field.focus();
			encryptField(field);
		});

		document.documentElement.appendChild(icon);
		return icon;
	}

	function positionIcon(field, icon) {
		const rect = field.getBoundingClientRect();
		const hidden = rect.width === 0 && rect.height === 0;
		const style = window.getComputedStyle(field);
		if (hidden || style.visibility === "hidden" || style.display === "none") {
			icon.style.display = "none";
			return;
		}
		icon.style.display = "block";
		const top = rect.top + window.scrollY + (rect.height - SIZE) / 2;
		const left = rect.left + window.scrollX + rect.width - SIZE - NATIVE_ICON_ALLOWANCE;
		icon.style.top = top + "px";
		icon.style.left = left + "px";
	}

	function attachToField(field) {
		if (field.getAttribute(ICON_ATTR)) return;
		field.setAttribute(ICON_ATTR, "true");
		const icon = makeIcon(field);
		tracked.set(field, icon);
		positionIcon(field, icon);
	}

	function scan() {
		document.querySelectorAll('input[type="password"]').forEach(attachToField);
		for (const [field, icon] of tracked) {
			if (!document.documentElement.contains(field)) {
				icon.remove();
				tracked.delete(field);
			}
		}
	}

	function repositionAll() {
		for (const [field, icon] of tracked) positionIcon(field, icon);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", scan);
	} else {
		scan();
	}

	new MutationObserver(scan).observe(document.documentElement, {childList: true, subtree: true});
	window.addEventListener("scroll", repositionAll, true);
	window.addEventListener("resize", repositionAll);
	// Safety net for layout shifts (animations, late CSS, etc.) that don't
	// fire a scroll/resize event or DOM mutation we'd otherwise catch.
	setInterval(repositionAll, 500);
})();
