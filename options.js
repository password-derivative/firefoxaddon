const commandName = 'toggle-feature';

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
  console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#passwordsize").value = res.passwordsize || '16';
  });
  
  var gettingItem = browser.storage.local.get('complexdomains');
  console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#complexdomains").value = res.complexdomains || '';
  });
  
  var gettingItem = browser.storage.local.get('hashalgo');
  console.log(gettingItem);
  gettingItem.then((res) => {
    document.querySelector("#hashalgo").value = res.hashalgo || 'sha512';
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
	if (isNaN(passwordsize)) {
		document.querySelector("#passwordsize").value = 16; //largest size HMAC256 in BASE64 supports
	}
	if (passwordsize > 44) {
		document.querySelector("#passwordsize").value = 44; //largest size HMAC256 in BASE64 supports
	}
	
  console.log("saving options");
  console.log(document.querySelector("#passwordsize").value);
  browser.storage.local.set({
    passwordsize: document.querySelector("#passwordsize").value
  });
  console.log(document.querySelector("#complexdomains").value);
  browser.storage.local.set({
    complexdomains: document.querySelector("#complexdomains").value
  });
  console.log(document.querySelector("#hashalgo").value);
  browser.storage.local.set({
    hashalgo: document.querySelector("#hashalgo").value
  });
  e.preventDefault();
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