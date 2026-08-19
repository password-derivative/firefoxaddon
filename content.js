'use strict';
const debug = false;

let myPort = browser.runtime.connect({name:"strongpassword-content-port"});
myPort.postMessage({greeting: "Hello from content script"});
var replyPort;

// Filled in below by the inline-icon module; exposed here so the message
// handler can flip a field's icon to "locked" once encryption actually
// succeeds, rather than immediately on click.
let iconApi = { markEncrypted: function () {} };

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
					  iconApi.markEncrypted(inputfield);
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

 The icon shows an open padlock by default, and switches to a closed
 padlock once encryption for that specific field has actually succeeded
 (not just on click, so a failed attempt doesn't falsely show "locked").
 If the field is edited afterwards, the icon reopens, since the visible
 value no longer matches the derivative that was just confirmed.
 **/
(function () {
	const ICON_ATTR = "data-pwderiv-icon-attached";
	const SIZE = 18;
	// Rough allowance so we don't sit on top of the browser's own native
	// "show password" eye icon, which is drawn by the browser itself and
	// isn't something a content script can measure directly.
	const NATIVE_ICON_ALLOWANCE = 26;

	const UNLOCKED_COLOR = "#000000";
	const LOCKED_COLOR = "#9aa0a6";
	const SVG_NS = "http://www.w3.org/2000/svg";

	// Simple, self-drawn padlock shapes (not lifted from any icon set):
	// a rounded body plus a shackle arc, either closed (both legs meeting
	// the body) or swung open (right leg lifted away).
	const SHACKLE_CLOSED = "M8 10V7a4 4 0 0 1 8 0v3";
	const SHACKLE_OPEN = "M8 10V7a4 4 0 0 1 7.4-2.2";

	// Built with DOM APIs (not innerHTML/outerHTML with a string) since the
	// values are static either way, but the AMO linter flags any innerHTML
	// assignment regardless of whether the content is dynamic or not.
	function buildLockSvg(shacklePath, color) {
		const svg = document.createElementNS(SVG_NS, "svg");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("width", String(SIZE));
		svg.setAttribute("height", String(SIZE));
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", color);
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");

		const body = document.createElementNS(SVG_NS, "rect");
		body.setAttribute("x", "5");
		body.setAttribute("y", "10");
		body.setAttribute("width", "14");
		body.setAttribute("height", "10");
		body.setAttribute("rx", "2");
		svg.appendChild(body);

		const shackle = document.createElementNS(SVG_NS, "path");
		shackle.setAttribute("d", shacklePath);
		svg.appendChild(shackle);

		return svg;
	}

	const tracked = new Map(); // password field -> our injected icon element

	function encryptField(field) {
		myPort.postMessage({
			greeting: "encrypt-password",
			port: replyPort,
			domainvalue: tldjs.getDomain(window.location.hostname),
			passwordvalue: field.value
		});
	}

	function setLocked(icon, locked) {
		icon.dataset.locked = locked ? "true" : "false";
		while (icon.firstChild) icon.removeChild(icon.firstChild);
		icon.appendChild(buildLockSvg(
			locked ? SHACKLE_CLOSED : SHACKLE_OPEN,
			locked ? LOCKED_COLOR : UNLOCKED_COLOR
		));
		icon.title = locked
			? (browser.i18n.getMessage("inlineIconTitleLocked") || "Password encrypted")
			: (browser.i18n.getMessage("inlineIconTitle") || "Encrypt password");
		icon.style.cursor = locked ? "default" : "pointer";
		icon.style.opacity = locked ? "0.6" : "0.75";
	}

	function makeIcon(field) {
		const icon = document.createElement("div");
		icon.setAttribute("data-pwderiv-icon", "true");
		icon.style.position = "absolute";
		icon.style.width = SIZE + "px";
		icon.style.height = SIZE + "px";
		icon.style.cursor = "pointer";
		icon.style.zIndex = "2147483647";
		icon.style.lineHeight = "0";
		icon.style.opacity = "0.75";
		icon.style.pointerEvents = "auto";
		setLocked(icon, false);

		icon.addEventListener("mouseenter", () => {
			if (icon.dataset.locked !== "true") icon.style.opacity = "1";
		});
		icon.addEventListener("mouseleave", () => {
			if (icon.dataset.locked !== "true") icon.style.opacity = "0.75";
		});

		// Keep focus on the password field itself when the icon is tapped
		// (mouse or touch - touch devices synthesize a mousedown/click pair
		// too, unless the touchstart itself is preventDefault()'d, which is
		// why there's no separate touchstart handler here: doing that would
		// suppress the click event entirely on touch devices, and the icon
		// would silently stop responding to taps on mobile), so
		// document.activeElement stays the field (the encrypt flow relies
		// on that) instead of jumping to the icon.
		icon.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
		icon.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			// Once encryption has succeeded, the icon is inert until the
			// field is edited again - this prevents accidentally
			// re-encrypting an already-encrypted value by clicking twice.
			if (icon.dataset.locked === "true") return;
			field.focus();
			encryptField(field);
		});

		// Editing the field after a successful encryption means the value
		// shown no longer matches what was just confirmed - reopen the lock.
		field.addEventListener("input", () => {
			if (icon.dataset.locked === "true") setLocked(icon, false);
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

	iconApi.markEncrypted = function (field) {
		const icon = tracked.get(field);
		if (icon) setLocked(icon, true);
	};
})();
