const commandName = 'toggle-feature';

let DEFAULTpasswordsize = 16;
let DEFAULTcomplexdomains = "";
let DEFAULThashalgo = "sha512";
//Settings for SCrypt
let DEFAULTsalt = "domainname"; //(64 bits minimum, 128 bits recommended)
let DEFAULTcpu = "4096";
let DEFAULTmemory = "8";
let DEFAULTparallel = "1";
let DEFAULThashalgosize = "64";
const debug = false;

let myPort = browser.runtime.connect({name:"strongpassword-port"});
myPort.postMessage({greeting: "Hello from option script"});

/**
Listen to messges from background script
When message received, encrypt the password
**/
myPort.onMessage.addListener(function(m) {
  if (debug) console.log("Received from background script: " + m.greeting);
	switch(m.greeting) {
		case "encrypt-success":
			if (m.derivative) {
			  document.querySelector("#outcome").value = m.derivative;
			}
		break;
		case "encrypt-failed-null-value":
			document.querySelector("#outcome").value = "a value entered is incorrect";
		break;
	}
});
/**
 * Update the UI: set the value of the shortcut textbox.
 */
async function updateUI() {
  let commands = await browser.commands.getAll();
  for (command of commands) {
    if (command.name === commandName) {
      document.querySelector('#shortcut').value = command.shortcut;
    }
  }

  var gettingItem = browser.storage.local.get('passwordsize');
  if (debug) console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#passwordsize").value = res.passwordsize || DEFAULTpasswordsize;
  });
  
  var gettingItem = browser.storage.local.get('complexdomains');
  if (debug) console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#complexdomains").value = res.complexdomains || DEFAULTcomplexdomains;
  });
  
  var gettingItem = browser.storage.local.get('hashalgo');
  if (debug) console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#hashalgo").value = res.hashalgo || DEFAULThashalgo;
	updateScryptUI();
  });
  var gettingItem = browser.storage.local.get('salt');
  if (debug) console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#salt").value = res.salt || DEFAULTsalt;
  });
  
  var gettingItem = browser.storage.local.get('cpu');
  if (debug) console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#cpu").value = res.cpu || DEFAULTcpu;
  });
  
  var gettingItem = browser.storage.local.get('memory');
  if (debug) console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#memory").value = res.memory || DEFAULTmemory;
  });
  
  var gettingItem = browser.storage.local.get('parallel');
  if (debug) console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#parallel").value = res.parallel || DEFAULTparallel;
  });
  
  var gettingItem = browser.storage.local.get('hashalgosize');
  if (debug) console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#hashalgosize").value = res.hashalgosize || DEFAULThashalgosize;
  });
}

/**
 * Update the shortcut based on the value in the textbox.
 */
async function updateShortcut() {
  await browser.commands.update({
    name: commandName,
    shortcut: document.querySelector('#shortcut').value
  });
}

/**
 * Reset the shortcut and update the textbox.
 */
async function resetShortcut() {
  await browser.commands.reset(commandName);
  updateUI();
}

function saveOptions(e) {
	var passwordsize = document.querySelector("#passwordsize").value;
	var cpu = document.querySelector("#cpu").value;
	var memory = document.querySelector("#memory").value;
	var parallel = document.querySelector("#parallel").value;
	var hashalgosize = document.querySelector("#hashalgosize").value;
	
	if (isNaN(passwordsize)) {
		document.querySelector("#passwordsize").value = DEFAULTpasswordsize; //size needs to be a number
	}
	if (passwordsize > 44) {
		document.querySelector("#passwordsize").value = 44; //largest size HMAC256 in BASE64 supports
	}
	
	//CPU must be larger than 1, a power of 2 and less than 2^(128 * memory / 8)
	//Protected by dropdown field to satisfy this requirement
	if (isNaN(cpu)) {
		document.querySelector("#cpu").value = DEFAULTcpu;
	}
	if (cpu < 1) {
		document.querySelector("#cpu").value = DEFAULTcpu; //smallest size SCrypt supports
	}
	if (cpu > 65536) {
		document.querySelector("#cpu").value = DEFAULTcpu; //largest size the derivative addon supports
	}
	if (isNaN(memory)) {
		document.querySelector("#memory").value = DEFAULTmemory;
	}
	if (memory < 1) {
		document.querySelector("#memory").value = DEFAULTmemory; //smallest size SCrypt supports
	}
	if (memory > 65536) {
		document.querySelector("#memory").value = DEFAULTmemory; //largest size the derivative addon supports
	}
	if (isNaN(parallel)) {
		document.querySelector("#parallel").value = DEFAULTparallel;
	}
	if (parallel < 1) {
		document.querySelector("#parallel").value = DEFAULTparallel; //smallest size SCrypt supports
	}
	if (parallel > 44) {
		document.querySelector("#parallel").value = DEFAULTparallel; //largest size the derivative addon supports
	}
	if (isNaN(hashalgosize)) {
		document.querySelector("#hashalgosize").value = DEFAULThashalgosize;
	}
	if (hashalgosize < 60) {
		document.querySelector("#hashalgosize").value = DEFAULThashalgosize; //smallest size the derivative addon supports
	}
	if (hashalgosize > 256) {
		document.querySelector("#hashalgosize").value = DEFAULThashalgosize; //largest size the derivative addon supports
	}
	
  if (debug) console.log("saving options");
  if (debug) console.log(document.querySelector("#passwordsize").value);
  browser.storage.local.set({
    passwordsize: document.querySelector("#passwordsize").value
  });
  if (debug) console.log(document.querySelector("#complexdomains").value);
  browser.storage.local.set({
    complexdomains: document.querySelector("#complexdomains").value
  });
  if (debug) console.log(document.querySelector("#hashalgo").value);
  browser.storage.local.set({
    hashalgo: document.querySelector("#hashalgo").value
  });
  if (debug) console.log(DEFAULTsalt);
  browser.storage.local.set({
    salt: DEFAULTsalt
  });
  if (debug) console.log(document.querySelector("#cpu").value);
  browser.storage.local.set({
    cpu: document.querySelector("#cpu").value
  });
  if (debug) console.log(document.querySelector("#memory").value);
  browser.storage.local.set({
    memory: document.querySelector("#memory").value
  });
  if (debug) console.log(document.querySelector("#parallel").value);
  browser.storage.local.set({
    parallel: document.querySelector("#parallel").value
  });
  if (debug) console.log(document.querySelector("#hashalgosize").value);
  browser.storage.local.set({
    hashalgosize: document.querySelector("#hashalgosize").value
  });
  
  e.preventDefault();
}

async function updateScryptUI() {
	if (document.querySelector("#hashalgo").value == "scrypt") {
		document.querySelector("#scryptsettings").style.display = "block";
	} else {
		document.querySelector("#scryptsettings").style.display = "none";
	}
}

function performCalculate() {	
	myPort.postMessage({greeting: "encrypt-password", 
						domainvalue: document.querySelector("#domain").value, 
						passwordvalue: document.querySelector("#password").value, 
						passwordsize: document.querySelector("#passwordsize").value, 
						hashalgo: document.querySelector("#hashalgo").value
						});
}
/**
 * Update the UI when the page loads.
 */
document.addEventListener('DOMContentLoaded', updateUI);

/**
 * Handle update and reset button clicks
 */
document.querySelector('#update').addEventListener('click', updateShortcut)
document.querySelector('#reset').addEventListener('click', resetShortcut)
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector('#calculate').addEventListener('click', performCalculate);
document.querySelector('#hashalgo').addEventListener('change', updateScryptUI);