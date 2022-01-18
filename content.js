
let myPort = browser.runtime.connect({name:"strongpassword-port"});
myPort.postMessage({greeting: "Hello from content script"});
let DEFAULTpasswordsize = 16;
let DEFAULTcomplexdomains = "";
let DEFAULThashalgo = "sha512";

/**
Listen to messges from background script
When message received, encrypt the password
**/
myPort.onMessage.addListener(function(m) {
  console.log("Received from background script: " + m.greeting);
  
  if (m.greeting == "encrypt-password") {
	var passwordSizeItem = browser.storage.local.get('passwordsize');
	var passwordsize = DEFAULTpasswordsize;
	passwordSizeItem.then((res) => {
		passwordsize = res.passwordsize || DEFAULTpasswordsize;	
		var complexdomainsItem = browser.storage.local.get('complexdomains');
		var complexdomains = DEFAULTcomplexdomains;
		complexdomainsItem.then((res) => {
			complexdomains = res.complexdomains || DEFAULTcomplexdomains;
			var hashalgoItem = browser.storage.local.get('hashalgo');
			var hashalgo = DEFAULThashalgo;
			hashalgoItem.then((res) => {
				hashalgo = res.hashalgo || DEFAULThashalgo;
				var inputfield = window.document.activeElement;
				if (inputfield.type.toLowerCase() === "password") {
					if (inputfield.value == "") {
						myPort.postMessage({greeting: "encrypt-failed-null-value"});
					} else {
						var hostname = tldjs.getDomain(window.location.hostname);
						myPort.postMessage({greeting: "Hostname: " + hostname});
						
						//derive a password
						myPort.postMessage({greeting: "Using algo: "+ hashalgo});
						switch(hashalgo) {
						  case "sha256":
							var newHMAC = CryptoJS.HmacSHA256(hostname, inputfield.value);
							break;
						  case "sha384":
							var newHMAC = CryptoJS.HmacSHA384(hostname, inputfield.value);
							break;
						  case "sha3":
							var newHMAC = CryptoJS.HmacSHA3(hostname, inputfield.value);
							break;
						  default:
							var newHMAC = CryptoJS.HmacSHA512(hostname, inputfield.value);
						} 
						var base64String = CryptoJS.enc.Base64.stringify(newHMAC);
						var finalBase64String = base64String.slice(0, passwordsize);
						myPort.postMessage({greeting: newHMAC.toString()});
						myPort.postMessage({greeting: base64String});
						myPort.postMessage({greeting: finalBase64String});
						
						//process domains that have complexity requirements
						var arr = complexdomains.split("\n");
						myPort.postMessage({greeting: arr.length + " saved complex domains found"});
						for (var i = 0; i < arr.length; i++)
						{
							var thisdomain = arr[i].split(" ");
							if (thisdomain[0] == hostname) {
								myPort.postMessage({greeting: "complex domain matched"});
								finalBase64String = finalBase64String + thisdomain[1];
							}
						}
						
						//update the password field
						inputfield.value = finalBase64String;
					  
						myPort.postMessage({greeting: "encrypt-success"});
					}
			   }
			});
		});
	});
  }
});
