const debug = false;
const commandName = 'toggle-feature';

let DEFAULTpasswordsalt = "";
let DEFAULTdomainsalt = "";
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
		case "random-bytes-success":
			if (m.field) {
			  document.querySelector("#"+m.field).value = m.randomByteString;
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
	  hashalgo: DEFAULThashalgo,
	  complexdomains: DEFAULTcomplexdomains,
	  passwordsalt: DEFAULTpasswordsalt,
	  domainsalt: DEFAULTdomainsalt,
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
		document.querySelector("#hashalgo").value = res.hashalgo;
		document.querySelector("#complexdomains").value = res.complexdomains;
		document.querySelector("#passwordsalt").value = res.passwordsalt;
		document.querySelector("#domainsalt").value = res.domainsalt;
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
	var passwordsalt = document.querySelector("#passwordsalt").value;
	var domainsalt = document.querySelector("#domainsalt").value;
	
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
	
	//Remove non-base64 characters
	var passwordsalt = passwordsalt.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+\/=]/gi, '');
	document.querySelector("#passwordsalt").value = passwordsalt;
	var domainsalt = domainsalt.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+\/=]/gi, '');
	document.querySelector("#domainsalt").value = domainsalt;
	
  if (debug) console.log("saving options");
  
  var optionschosen = {
	  passwordsize: document.querySelector("#passwordsize").value,
	  hashalgo: document.querySelector("#hashalgo").value,
	  complexdomains: document.querySelector("#complexdomains").value,
	  passwordsalt: passwordsalt,
	  domainsalt: domainsalt,
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
	var passwordsize = document.querySelector("#passwordsize").value;
	var cpu = document.querySelector("#cpu").value;
	var memory = document.querySelector("#memory").value;
	var parallel = document.querySelector("#parallel").value;
	var hashalgosize = document.querySelector("#hashalgosize").value;
	var passwordsalt = document.querySelector("#passwordsalt").value;
	var domainsalt = document.querySelector("#domainsalt").value;
	
	if (isNaN(passwordsize)) passwordsize = DEFAULTpasswordsize; //size needs to be a number
	if (passwordsize < 1) passwordsize = 44; //smallest size the derivative addon supports
	if (passwordsize > 44) passwordsize = 44; //largest size HMAC256 in BASE64 supports
	
	//CPU must be larger than 1, a power of 2 and less than 2^(128 * memory / 8)
	//Protected by dropdown field to satisfy this requirement
	if (isNaN(cpu)) cpu = DEFAULTcpu;
	if (cpu < 1) cpu = DEFAULTcpu; //smallest size SCrypt supports
	if (cpu > 65536) cpu = DEFAULTcpu; //largest size the derivative addon supports
	if (isNaN(memory)) memory = DEFAULTmemory;
	if (memory < 1) memory = DEFAULTmemory; //smallest size SCrypt supports
	if (memory > 65536) memory = DEFAULTmemory; //largest size the derivative addon supports
	if (isNaN(parallel)) parallel = DEFAULTparallel;
	if (parallel < 1) parallel = DEFAULTparallel; //smallest size SCrypt supports
	if (parallel > 44) parallel = DEFAULTparallel; //largest size the derivative addon supports
	if (isNaN(hashalgosize)) hashalgosize = DEFAULThashalgosize;
	if (hashalgosize < 60) hashalgosize = DEFAULThashalgosize; //smallest size the derivative addon supports
	if (hashalgosize > 256) hashalgosize = DEFAULThashalgosize; //largest size the derivative addon supports
	
	//Remove non-base64 characters
	var passwordsalt = document.querySelector("#passwordsalt").value;
	passwordsalt = passwordsalt.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+\/=]/gi, '');
	var domainsalt = document.querySelector("#domainsalt").value
	domainsalt = domainsalt.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+\/=]/gi, '');
	
	//Set algo field
	document.querySelector("#algooutcome").value = document.querySelector("#hashalgo").value;
	
	//request calculation
	myPort.postMessage({greeting: "encrypt-password", port: replyPort,
						domainvalue: document.querySelector("#domain").value, 
						passwordvalue: document.querySelector("#password").value, 
						passwordsize: passwordsize, 
						hashalgo: document.querySelector("#hashalgo").value,
						passwordsalt: passwordsalt,
						domainsalt: domainsalt,
					    cpu: cpu,
						memory: parallel,
						parallel: parallel,
						hashalgosize: hashalgosize
						});
						
	//get configuration
	var getConfigurationItem = browser.storage.local.get({
	  hashalgo: DEFAULThashalgo,
	  passwordsalt: DEFAULTpasswordsalt,
	  domainsalt: DEFAULTdomainsalt,
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
		if (document.querySelector("#passwordsalt").value != res.passwordsalt) notsaved = true;
		if (document.querySelector("#domainsalt").value != res.domainsalt) notsaved = true;
		if (document.querySelector("#salt").value != res.salt) notsaved = true;
		if (document.querySelector("#cpu").value != res.cpu) notsaved = true;
		if (document.querySelector("#memory").value != res.memory) notsaved = true;
		if (document.querySelector("#parallel").value != res.parallel) notsaved = true;
		if (document.querySelector("#hashalgosize").value != res.hashalgosize) notsaved = true;
		
		if (notsaved) document.querySelector("#algooutcome").value = document.querySelector("#hashalgo").value + " (not saved yet!)";
	});
	
}

function performGeneratepasswordsalt32() {
	if (debug) console.log("requesting random-bytes");
	myPort.postMessage({greeting: "random-bytes", port: replyPort,
					amount: 32,
					field: "passwordsalt"
					});
}
function performGeneratepasswordsalt64() {
	if (debug) console.log("requesting random-bytes");
	myPort.postMessage({greeting: "random-bytes", port: replyPort,
					amount: 64,
					field: "passwordsalt"
					});
}
function performGeneratepasswordsalt128() {
	if (debug) console.log("requesting random-bytes");
	myPort.postMessage({greeting: "random-bytes", port: replyPort,
					amount: 128,
					field: "passwordsalt"
					});
}
function performGeneratepasswordsalt256() {
	if (debug) console.log("requesting random-bytes");
	myPort.postMessage({greeting: "random-bytes", port: replyPort,
					amount: 256,
					field: "passwordsalt"
					});
}
function performGeneratedomainsalt32() {
	if (debug) console.log("requesting random-bytes");
	myPort.postMessage({greeting: "random-bytes", port: replyPort,
					amount: 32,
					field: "domainsalt"
					});
}
function performGeneratedomainsalt64() {
	if (debug) console.log("requesting random-bytes");
	myPort.postMessage({greeting: "random-bytes", port: replyPort,
					amount: 64,
					field: "domainsalt"
					});
}
function performGeneratedomainsalt128() {
	if (debug) console.log("requesting random-bytes");
	myPort.postMessage({greeting: "random-bytes", port: replyPort,
					amount: 128,
					field: "domainsalt"
					});
}
function performGeneratedomainsalt256() {
	if (debug) console.log("requesting random-bytes");
	myPort.postMessage({greeting: "random-bytes", port: replyPort,
					amount: 256,
					field: "domainsalt"
					});
}

/**
 * Update the UI when the page loads.
 */
document.addEventListener('DOMContentLoaded', updateUI);

/**
 * Handle tab clicks
 */
document.querySelector('#basicoptions').addEventListener('click', basicUI);
document.querySelector('#advancedoptions').addEventListener('click', advancedUI);
document.querySelector('#verifyoptions').addEventListener('click', verifyUI);

/**
 * Handle update and reset button clicks
 */
document.querySelector('#update').addEventListener('click', updateShortcut)
document.querySelector('#reset').addEventListener('click', resetShortcut)
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector('#calculate').addEventListener('click', performCalculate);

document.querySelector('#generatepasswordsalt32').addEventListener('click', performGeneratepasswordsalt32);
document.querySelector('#generatepasswordsalt64').addEventListener('click', performGeneratepasswordsalt64);
document.querySelector('#generatepasswordsalt128').addEventListener('click', performGeneratepasswordsalt128);
document.querySelector('#generatepasswordsalt256').addEventListener('click', performGeneratepasswordsalt256);
document.querySelector('#generatedomainsalt32').addEventListener('click', performGeneratedomainsalt32);
document.querySelector('#generatedomainsalt64').addEventListener('click', performGeneratedomainsalt64);
document.querySelector('#generatedomainsalt128').addEventListener('click', performGeneratedomainsalt128);
document.querySelector('#generatedomainsalt256').addEventListener('click', performGeneratedomainsalt256);

