const debug = false;
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

let myPort = browser.runtime.connect({name:"strongpassword-option-port"});
myPort.postMessage({greeting: "Hello from option script", port: "strongpassword-option-port"});
let replyPort;
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
		case "encrypt-success":
			if (m.derivative) {
			  document.querySelector("#outcome").value = m.derivative;
			}
		break;
		case "encrypt-failed-null-value":
			document.querySelector("#outcome").value = "the password is empty";
		break;
		case "encrypt-failed-null-domain-value":
			document.querySelector("#outcome").value = "the domain is empty";
		break;
		case "encrypt-failed-domain-value":
			document.querySelector("#outcome").value = "the domainname is not valid";
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
  
	//get configuration
	var getConfigurationItem = browser.storage.local.get({
	  passwordsize: DEFAULTpasswordsize,
	  complexdomains: DEFAULTcomplexdomains,
	  hashalgo: DEFAULThashalgo,
	  salt: DEFAULTsalt,
	  cpu: DEFAULTcpu,
	  memory: DEFAULTmemory,
	  parallel: DEFAULTparallel,
	  hashalgosize: DEFAULThashalgosize
	});
	
	if (debug) console.log(getConfigurationItem);
	
	getConfigurationItem.then((res) => {
		if (debug) console.log(getConfigurationItem);
		document.querySelector("#passwordsize").value = res.passwordsize;
		document.querySelector("#complexdomains").value = res.complexdomains;
		document.querySelector("#hashalgo").value = res.hashalgo;
		document.querySelector("#salt").value = res.salt;
		document.querySelector("#cpu").value = res.cpu;
		document.querySelector("#memory").value = res.memory;
		document.querySelector("#parallel").value = res.parallel;
		document.querySelector("#hashalgosize").value = res.hashalgosize;
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

/**
 * Save the chosen options
 **/
function saveOptions(e) {
	var passwordsize = document.querySelector("#passwordsize").value;
	var cpu = document.querySelector("#cpu").value;
	var memory = document.querySelector("#memory").value;
	var parallel = document.querySelector("#parallel").value;
	var hashalgosize = document.querySelector("#hashalgosize").value;
	
	if (isNaN(passwordsize)) document.querySelector("#passwordsize").value = DEFAULTpasswordsize; //size needs to be a number
	if (passwordsize < 1) document.querySelector("#passwordsize").value = 44; //smallest size the derivative addon supports
	if (passwordsize > 44) document.querySelector("#passwordsize").value = 44; //largest size HMAC256 in BASE64 supports
	
	//CPU must be larger than 1, a power of 2 and less than 2^(128 * memory / 8)
	//Protected by dropdown field to satisfy this requirement
	if (isNaN(cpu)) document.querySelector("#cpu").value = DEFAULTcpu;
	if (cpu < 1) document.querySelector("#cpu").value = DEFAULTcpu; //smallest size SCrypt supports
	if (cpu > 65536) document.querySelector("#cpu").value = DEFAULTcpu; //largest size the derivative addon supports
	if (isNaN(memory)) document.querySelector("#memory").value = DEFAULTmemory;
	if (memory < 1) document.querySelector("#memory").value = DEFAULTmemory; //smallest size SCrypt supports
	if (memory > 65536) document.querySelector("#memory").value = DEFAULTmemory; //largest size the derivative addon supports
	if (isNaN(parallel)) document.querySelector("#parallel").value = DEFAULTparallel;
	if (parallel < 1) document.querySelector("#parallel").value = DEFAULTparallel; //smallest size SCrypt supports
	if (parallel > 44) document.querySelector("#parallel").value = DEFAULTparallel; //largest size the derivative addon supports
	if (isNaN(hashalgosize)) document.querySelector("#hashalgosize").value = DEFAULThashalgosize;
	if (hashalgosize < 60) document.querySelector("#hashalgosize").value = DEFAULThashalgosize; //smallest size the derivative addon supports
	if (hashalgosize > 256) document.querySelector("#hashalgosize").value = DEFAULThashalgosize; //largest size the derivative addon supports
	
  if (debug) console.log("saving options");
  
  var optionschosen = {
	  passwordsize: document.querySelector("#passwordsize").value,
	  complexdomains: document.querySelector("#complexdomains").value,
	  hashalgo: document.querySelector("#hashalgo").value,
	  salt: DEFAULTsalt,
	  cpu: document.querySelector("#cpu").value,
	  memory: document.querySelector("#memory").value,
	  parallel: document.querySelector("#parallel").value,
	  hashalgosize: document.querySelector("#hashalgosize").value
  };
  
  if (debug) console.log(optionschosen);
  
  browser.storage.local.set(optionschosen);
  
  e.preventDefault();
}

async function basicUI() {
	document.querySelector("#basicoptions").className = "tab-button tab-button-active";
	document.querySelector("#advancedoptions").className = "tab-button";
	document.querySelector("#verifyoptions").className = "tab-button";
	
	document.querySelector("#basicsettings").style.display = "block";
	document.querySelector("#advancedsettings").style.display = "none";
	document.querySelector("#verifysettings").style.display = "none";
	document.querySelector("#scryptsettings").style.display = "none";
}

async function advancedUI() {
	document.querySelector("#basicoptions").className = "tab-button";
	document.querySelector("#advancedoptions").className = "tab-button tab-button-active";
	document.querySelector("#verifyoptions").className = "tab-button";
	
	document.querySelector("#basicsettings").style.display = "none";
	document.querySelector("#advancedsettings").style.display = "block";
	document.querySelector("#verifysettings").style.display = "none";
	document.querySelector("#scryptsettings").style.display = "none";
	
	if (document.querySelector("#hashalgo").value == "scrypt") {
		document.querySelector("#scryptsettings").style.display = "block";
	} else {
		document.querySelector("#scryptsettings").style.display = "none";
	}
}

async function verifyUI() {
	document.querySelector("#basicoptions").className = "tab-button";
	document.querySelector("#advancedoptions").className = "tab-button";
	document.querySelector("#verifyoptions").className = "tab-button tab-button-active";
	
	document.querySelector("#basicsettings").style.display = "none";
	document.querySelector("#advancedsettings").style.display = "none";
	document.querySelector("#verifysettings").style.display = "block";
	document.querySelector("#scryptsettings").style.display = "none";
}

function performCalculate() {
	document.querySelector("#algooutcome").value = document.querySelector("#hashalgo").value;
	
	myPort.postMessage({greeting: "encrypt-password", port: replyPort,
						domainvalue: document.querySelector("#domain").value, 
						passwordvalue: document.querySelector("#password").value, 
						passwordsize: document.querySelector("#passwordsize").value, 
						hashalgo: document.querySelector("#hashalgo").value,
					    cpu: document.querySelector("#cpu").value,
						memory: document.querySelector("#memory").value,
						parallel: document.querySelector("#parallel").value,
						hashalgosize: document.querySelector("#hashalgosize").value
						});
						
	//get configuration
	var getConfigurationItem = browser.storage.local.get({
	  hashalgo: DEFAULThashalgo,
	  salt: DEFAULTsalt,
	  cpu: DEFAULTcpu,
	  memory: DEFAULTmemory,
	  parallel: DEFAULTparallel,
	  hashalgosize: DEFAULThashalgosize
	});
	
	if (debug) console.log(getConfigurationItem);
	
	getConfigurationItem.then((res) => {
		if (debug) console.log(getConfigurationItem);
		var notsaved = false;
		if (document.querySelector("#hashalgo").value != res.hashalgo) notsaved = true;
		if (document.querySelector("#salt").value != res.salt) notsaved = true;
		if (document.querySelector("#cpu").value != res.cpu) notsaved = true;
		if (document.querySelector("#memory").value != res.memory) notsaved = true;
		if (document.querySelector("#parallel").value != res.parallel) notsaved = true;
		if (document.querySelector("#hashalgosize").value != res.hashalgosize) notsaved = true;
		
		if (notsaved) document.querySelector("#algooutcome").value = document.querySelector("#hashalgo").value + " (not saved yet!)";
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

document.querySelector('#basicoptions').addEventListener('click', basicUI);
document.querySelector('#advancedoptions').addEventListener('click', advancedUI);
document.querySelector('#verifyoptions').addEventListener('click', verifyUI);