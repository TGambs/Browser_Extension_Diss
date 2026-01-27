// This is used for most processing
// kyber is done here
// recieve data using "chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {});"
// use crypto.subtle for AES computations
import { MlKem768 } from "crystals-kyber-js";
import { error } from "jquery";

console.log("\n--- Background.js loading ---");

//create instance
const KEM = new MlKem768();

//const recipient = new MlKem768();
//console.log(recipient);

// Test function
/*chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request);

  if (request.action === "test") {
    sendResponse({
      success: true,
      message: "Background is working!",
    });
  }

  return true; // Keep channel open for async
});
*/

//------------------------ Gen Keys --------------------------------------------------
// function to generate key pair
async function genKeyPair() {
  try {
    //generate pair
    const [publicKey, secretKey] = await KEM.generateKeyPair();

    // Convert to base64 for easy transmission
    const pkBase64 = btoa(String.fromCharCode(...publicKey));
    const skBase64 = btoa(String.fromCharCode(...secretKey));

    // return all data to frontside
    return {
      success: true,
      publicKey: pkBase64,
      secretKey: skBase64,
      publicKeyLength: publicKey.length,
      secretKeyLength: secretKey.length,
    };

    //catch any errors and return error mssg to frontside
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

//------------------------ ^ Gen Keys ^ --------------------------------------------------

//------------------------ Storage test --------------------------------------------------
async function genRandNumber() {
  // gen number
  const ranNum = Math.floor(Math.random() * 100);

  const { randomNums } = await chrome.storage.local.get({
    randomNums: [],
  });

  // access local chrome memory and save new number
  try {
    // get any previous data from storage
    const prevData = await chrome.storage.local.get({ randomNums: [] });

    // append new number into list
    randomNums.push(ranNum);

    // save to local memory
    await chrome.storage.local.set({ randomNums });
  } catch (error) {
    console.log("Failed to access and save in local memory");
    return {
      success: false,
      ranNum: 0,
      nhistory: [0, 0],
    };
  }

  return {
    success: true,
    ranNum,
    nHistory: randomNums,
  };
}

// for resetting the storage
async function resetRandomNumbers() {
  try {
    await chrome.storage.local.set({ randomNums: [] });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
//------------------------ ^ Storage test ^ --------------------------------------------------

// -------------------- Listeners --------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request);

  switch (request.action) {
    case "genKeys":
      genKeyPair()
        .then(sendResponse)
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "randomNumber":
      genRandNumber()
        .then(sendResponse)
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "resetRandomNumbers":
      resetRandomNumbers()
        .then(sendResponse)
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    // to catch any other case or error
    default:
      sendResponse({ success: false, error: "Unknown action" });
      return true;
  }
});

console.log("--- Background.js completed ---\n");
