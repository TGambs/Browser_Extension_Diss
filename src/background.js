// This is used for most processing
// kyber is done here
// recieve data using "chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {});"
// use crypto.subtle for AES computations

// -----------------------------------------------------
// from the documentation:

// import { MlKem768 } from "@dajiaji/mlkem";
// Using npm:
// import { MlKem768 } from "mlkem"; // or "crystals-kyber-js"  <-- Import line

// const recipient = new MlKem768();                      <-- This is the recipient creating public and private key
// const [pkR, skR] = await recipient.generateKeyPair();  <-- This is the recipient creating public and private key

// const sender = new MlKem768();
// const [ct, ssS] = await sender.encap(pkR);

// const ssR = await recipient.decap(ct, skR);
// ssS === ssR

// -----------------------------------------------------

import { MlKem768 } from "crystals-kyber-js";
//import { error } from "jquery";

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

// FOR TESTING
// global key vars made when generate key button is pressed
// then accessed by encrypt and decrypt
let storedPK = null;
let storedSK = null;

//------------------------ Gen Keys --------------------------------------------------
// function to generate key pair
async function genKeyPair() {
  try {
    //generate pair
    const [publicKey, secretKey] = await KEM.generateKeyPair();

    // Convert to base64 for easy transmission
    const pkBase64 = btoa(String.fromCharCode(...publicKey));
    const skBase64 = btoa(String.fromCharCode(...secretKey));

    storedPK = publicKey;
    storedSK = secretKey;

    // const [ct, ssS] = await KEM.encap(publicKey);
    // console.log(pkBase64);
    // console.log(btoa(String.fromCharCode(...ct)));
    // console.log(btoa(String.fromCharCode(...ssS)));

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

//------------------------ ENCRYPTION --------------------------------------------------

// define AES function to make key
async function findAESKey(secret) {
  const aesKey = await crypto.subtle.importKey(
    "raw", //formatted as raw bytes
    secret, //key data to use
    { name: "AES-GCM" }, // type of algorithm
    false, // doesnt need to be exported
    ["encrypt", "decrypt"], // key operations
  );

  return aesKey;
}

async function encryptMssg(mssg, pkR) {
  // needed for encryption:
  // - public key
  // - ct (sent to recipient)
  // - ssS (key for encryption / recipient calculates it using private key)

  // - now make aesKey using ssS
  // - need (initailiastion vector) IV  <- can be sent in plaintext
  // - need mssg to encrypt

  // sender generates ct + ssS
  // ct = ciphertext (not the message)
  // ssS = shared secret Sender
  const [ct, ssS] = await KEM.encap(pkR);

  // generate aes key
  const aesKey = await findAESKey(ssS);

  // generate new initialisation vector
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // make instance of textEncoder to translate the messg into utf8
  const encoder = new TextEncoder();
  const udata = encoder.encode(mssg);

  //encrypt the data using aes and the iv
  const eDataRaw = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    udata,
  );

  // change the raw data into an array of ints
  const eData = new Uint8Array(eDataRaw);

  return {
    ct,
    encMssg: eData,
    iv,
  };
}

//------------------------ ^ ENCRYPTION ^ --------------------------------------------------

//------------------------ DECRYPTION --------------------------------------------------
async function decryptMssg(ct, enMssg, iv, skR) {
  // get from message:
  // - ct
  // - encrypted message
  // - iv

  // got private key already - matching the public one that was used for encryption

  // calulate the ssR (ssS == ssR) <- if done correctly
  const ssR = await KEM.decap(ct, skR);

  // calculate the AES key using ssR
  const aesKey = await findAESKey(ssR);

  //decrypt the message
  const decry = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    enMssg,
  );
  console.log(decry);

  // decode from utf8
  const decoder = new TextDecoder();
  const dMssg = decoder.decode(decry);
  return dMssg;
}

// run this when background.js is loaded
// (async () => {
//   // generate keys
//   const [pkR, skR] = await KEM.generateKeyPair();
//   const [pkS, skS] = await KEM.generateKeyPair();

//   const message = "ThisHasALengthOf18";
//   const { ct, encMssg, iv } = await encryptMssg(message, pkR);
//   console.log("--- Encrypted message:", ct, ...encMssg, iv);

//   const decMsg = await decryptMssg(ct, encMssg, iv, skR);
//   console.log("--- Decrypted message:", decMsg);
// })();
//------------------------ ^ DECRYPTION ^ --------------------------------------------------

//------------------------ Storage test --------------------------------------------------
// async function genRandNumber() {
//   // gen number
//   const ranNum = Math.floor(Math.random() * 100);
//   const { randomNums } = await chrome.storage.local.get({
//     randomNums: [],
//   });
//   // access local chrome memory and save new number
//   try {
//     // get any previous data from storage
//     const prevData = await chrome.storage.local.get({ randomNums: [] });

//     // append new number into list
//     randomNums.push(ranNum);

//     // save to local memory
//     await chrome.storage.local.set({ randomNums });
//   } catch (error) {
//     console.log("Failed to access and save in local memory");
//     return {
//       success: false,
//       ranNum: 0,
//       nhistory: [0, 0],
//     };
//   }
//   return {
//     success: true,
//     ranNum,
//     nHistory: randomNums,
//   };
// }

// sending data to storage
async function addStorageData(newPubKey, newPrivKey) {
  // too add data on, must first get old data, modify array, then "set" new data
  try {
    //fetch the already stored data
    const { pubKeys, privKeys } = await chrome.storage.local.get({
      pubKeys: [],
      privKeys: [],
    });

    // append the new data
    pubKeys.push(newPubKey);
    privKeys.push(newPrivKey);

    // save to storage
    await chrome.storage.local.set({ pubKeys, privKeys });

    console.log("New data saved to storage");
  } catch (error) {
    console.log("Storage set data error:", error);
  }
}

async function getStorageData() {
  try {
    // fetch stored keys
    const { pubKeys, privKeys } = await chrome.storage.local.get({
      pubKeys: [],
      privKeys: [],
    });

    console.log("Data fetched from storage");

    // print the storage as a table
    chrome.storage.local.get(null, (items) => {
      console.table(items);
    });

    return { success: true, pubKeys, privKeys };
  } catch (error) {
    console.log("Error getting stored data:", error);
  }
}

// for resetting the storage
async function clearStorage() {
  try {
    // can do this but only deletes set data
    /*await chrome.storage.local.set({
      pubKeys: [],
      privKeys: [],
    });*/

    // this completely resets all the local storage
    await chrome.storage.local.clear();

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/*
async function resetRandomNumbers() {
  try {
    await chrome.storage.local.set({ randomNums: [] });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}*/
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

    case "resetStorage":
      clearStorage()
        .then(sendResponse)
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "encryptMessage":
      //check if a key has been generated
      if (!storedPK) {
        sendResponse({ success: false, error: "No pk generated" });
        return true;
      }

      // if there is a key then use the encryption func to get the correct data
      encryptMssg(request.payload, storedPK)
        // .then takes the output of the function and sends the response back to popup
        .then(({ ct, encMssg, iv }) => {
          sendResponse({
            success: true,
            ct: btoa(String.fromCharCode(...ct)), // formatted from binary into ascii
            iv: btoa(String.fromCharCode(...iv)), // formatted from binary into ascii
            encMssg: btoa(String.fromCharCode(...encMssg)), // formatted from binary into ascii
          });
        })
        .catch((err) => sendResponse({ success: false, error: err.message }));

      return true;

    case "getStorage":
      getStorageData()
        .then(sendResponse)
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "addStorage":
      //get the payload data from message request
      const { pk, sk } = request.payload;
      addStorageData(pk, sk)
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
