// Popup.js is used for front-end stuff
// shouldnt do kyber here and processing should be minimal
// use "chrome.runtime.sendMessage(...)" to send data/trigger background.js

// ---------------------------

// here function is defined to call a response from "background.js"
// listeners are added to the buttons once "DOMContentLoaded"
// output from functions are written into html and swapped with the current output

console.log("\n--- popup.js loading ---\n");

//------------------------------- MAIN PAGE ------------------------------------------------------

async function encryptFromButton() {
  try {
    // get the data given in the text box
    const userData = document.getElementById("inData").value;
    const userPK = document.getElementById("enDeKeyInput").value;

    // send the action to background with the data in the payload
    const response = await chrome.runtime.sendMessage({
      action: "encryptMessage",
      payload: { userData, userPK },
    });
    console.log("Response from background:", response);

    if (response.success) {
      console.log("YES");

      // break down the reply into each part
      const { reply, ct, iv, encMssg } = response;

      // format the output with only the data needed
      const formatOutData = `ct = ${ct}\niv = ${iv}\nmssg = ${encMssg}`;

      // format the returned data and put it in the ouput text box
      document.getElementById("outData").value = formatOutData;
    } else {
      console.log("NO");
    }
  } catch (err) {
    console.error(err);
  }
}

async function decryptFromButton() {
  try {
    const rawData = document.getElementById("inData").value;
    const privKey = document.getElementById("enDeKeyInput").value;

    const ct = rawData.split("ct = ")[1].split("\n")[0].trim();
    const iv = rawData.split("iv = ")[1].split("\n")[0].trim();
    const encMssg = rawData.split("mssg = ")[1].trim();

    console.log(
      `Data input split into\n ct- ${ct}\niv- ${iv}\nmssg- ${encMssg}`,
    );

    if (privKey == null) {
      console.log("SK for encryption is invalid");
      return true;
    }

    const response = await chrome.runtime.sendMessage({
      action: "decryptMssg",
      payload: { ct, iv, encMssg, privKey },
    });

    if (response.success) {
      console.log("dec YES");

      const decMssg = response.decMssg;

      document.getElementById("outData").value = decMssg;
    }
  } catch (error) {
    console.log("Error decrypting: ", error);
  }
}

// Shouldve been inline js but extensions arent allowed any
function swapPage(pgNum) {
  var mainP = document.getElementById("mainPgCont");
  var strgP = document.getElementById("storagePgCont");
  var keyP = document.getElementById("keyPgCont");
  var faqP = document.getElementById("faqPgCont");

  mainP.style.display = "none";
  strgP.style.display = "none";
  keyP.style.display = "none";
  faqP.style.display = "none";

  switch (pgNum) {
    case 0:
      mainP.style.display = "block";
      break;

    case 1:
      strgP.style.display = "flex";
      strgP.style.flexDirection = "column";
      getPubKeyTable();
      break;

    case 2:
      keyP.style.display = "flex";
      getKGStorageTable();
      break;

    case 3:
      faqP.style.display = "block";
      break;
  }
}

//--------------------------------------------------------------------------------------------------

//------------------------------- KEY GEN PAGE ------------------------------------------------------

// Function to request new key pair
async function getNewKeyPair() {
  try {
    // call the backside genKeys method
    const response = await chrome.runtime.sendMessage({ action: "genKeys" });
    console.log("Response from background:", response);
    console.log("KEY PAIR MADE");

    const response1 = await chrome.runtime.sendMessage({
      action: "addKGStorage",
      payload: { pk: response.publicKey, sk: response.secretKey },
    });

    // if backside returns successfully then...
    if (response.success) {
      const response2 = await chrome.runtime.sendMessage({
        action: "getKGStorage",
      });
      console.log("Response from background:", response2);

      //update table with new data
      getKGStorageTable();
    }

    //if there is an error then print that instead
    else {
      document.getElementById("keyGenOutput").innerHTML =
        `<strong>Error:</strong> ${response.error}`;
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("keyGenOutput").innerHTML =
      `<strong>Error:</strong> ${error.message}`;
  }
}

// Gets the stored data and updates the table
let selKeyIndex = null;
async function getKGStorageTable() {
  //get table data
  const response = await chrome.runtime.sendMessage({
    action: "getKGStorage",
  });

  if (response.success) {
    const { pubKeys, privKeys } = response;

    // if the table is empty then exit before the header is shown
    if (pubKeys.length == 0) {
      document.getElementById("storageTable").innerHTML = "";
      return true;
    }

    // get the table from html
    let table = document.getElementById("storageTable");
    // make sure it is empty before adding anything new
    table.innerHTML = "";

    // define the header layout as an element
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
    <th>Public Keys</th>
    <th>Private Keys</th>
    `;

    // add the header to the table
    table.appendChild(headerRow);

    // reset the selected index when the table is reloaded
    selKeyIndex = null;

    pubKeys.forEach((pk, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${pk.slice(0, 35)}...</td>
      <td>${privKeys[i].slice(0, 35)}...</td>
      `;

      // then for each row add a listener to see if it has been selected
      row.addEventListener("click", () => {
        // unselect all rows
        table
          .querySelectorAll("tr")
          .forEach((rw) => rw.classList.remove("selected"));

        // add selected class to what row was clicked
        row.classList.add("selected");

        //save the index of what was selected
        selKeyIndex = i;
        console.log("Row ", selKeyIndex, "has been selected");
      });

      table.appendChild(row);
    });

    console.log("--------------");
    console.log(pubKeys);
    console.log(privKeys);
  } else {
    console.error("Error getting storageTable");
  }
}

// fo copying either key from the selected row
async function copyKGKey(isPublic) {
  //check if a row is selected
  if (selKeyIndex == null) {
    console.log("No row selected");
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: "getKGStorage",
    });

    if (response.success) {
      const { privKeys, pubKeys } = response;

      // if isPublic is true then use pubK array, if false use privK array
      const keyToCopy = isPublic ? pubKeys[selKeyIndex] : privKeys[selKeyIndex];

      // write to clipboard
      await navigator.clipboard.writeText(keyToCopy);
      console.log("Key copied to clipboard");
    } else {
      console.log("Error getting KG storage for copying");
    }
  } catch (error) {
    console.error("Error copying KG key: ", error);
  }
}

async function delKGKey() {
  //check if a row is selected
  if (selKeyIndex == null) {
    console.log("No row selected");
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: "getKGStorage",
    });

    if (response.success) {
      const { privKeys, pubKeys } = response;

      // delete the selected row from the array
      privKeys.splice(selKeyIndex, 1);
      pubKeys.splice(selKeyIndex, 1);

      // send the updated arrays back to storage
      await chrome.runtime.sendMessage({
        action: "setKGStorage",
        payload: { privKeys, pubKeys },
      });

      // update the visable table
      getKGStorageTable();

      console.log("Row number", selKeyIndex, " deleted");
    } else {
      console.log("Error getting KG keys to delete");
    }
  } catch (error) {
    console.log("Error deleting KG key row: ", error);
  }
}

// for testing chrome.storage
async function resetKGStorage() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "resetKGStorage",
    });
    console.log("Response from background:", response);

    if (response.success) {
      /*document.getElementById("storageResetAlert").innerHTML =
        "<p>History reset.</p>";*/

      //update table view with reset table
      getKGStorageTable();
    } else {
      document.getElementById("storageResetAlert").innerHTML =
        `<strong>Error:</strong> ${response.error}`;
    }
  } catch (err) {
    console.error(err);
  }
}

//-------------------------------------------------------------------------------------------------------

//------------------------------- KEY STORAGE PAGE ------------------------------------------------------

// get data from storage and format it into the table
async function getPubKeyTable() {
  //get table data
  const response = await chrome.runtime.sendMessage({
    action: "getPKStorage",
  });

  if (response.success) {
    const { keyRef, publicSKey } = response;

    if (keyRef.length == 0) {
      return true;
    }

    // get the table from html
    let table = document.getElementById("pkTable");

    // make sure it is empty before adding anything new
    table.innerHTML = "";

    // define the header
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
    <th>Ref.</th>
    <th>Public Keys</th>
    `;

    // add the header to the table
    table.appendChild(headerRow);

    // reset the selected index when the table is reloaded
    selKeyIndex = null;

    keyRef.forEach((ref, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${ref.slice(0, 35)}</td>
      <td>${publicSKey[i].slice(0, 35)}...</td>
      `;

      // then for each row add a listener to see if it has been selected
      row.addEventListener("click", () => {
        // unselect all rows
        table
          .querySelectorAll("tr")
          .forEach((rw) => rw.classList.remove("selected"));

        // add selected class to what row was clicked
        row.classList.add("selected");

        //save the index of what was selected
        selKeyIndex = i;
        console.log("Row ", selKeyIndex, "has been selected");
      });
      table.appendChild(row);
    });
  } else {
    console.error("Error getting Key Table");
  }
}

// adds new ref and key to local storage
async function setPubKeyTable() {
  try {
    //get values from page
    const inRef = document.getElementById("refIn").value;
    const inPubKey = document.getElementById("pkIn").value;

    //send request to background
    const response = await chrome.runtime.sendMessage({
      action: "addPKStorage",
      payload: { ref: inRef, pubKey: inPubKey },
    });
    console.log("Response from background:", response);

    if (response.success) {
      //if return is successful, update table view with new data
      getPubKeyTable();
    } else {
      console.log("Error - reply from adding to pkStorage table");
    }
  } catch (error) {
    console.log("error in setPubKeyTable:", error);
  }
}

async function wipeAllData() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "wipeAllData",
    });

    if (response.success) {
      document.getElementById("storageTable").innerHTML = "";
      document.getElementById("pkTable").innerHTML = "";
      console.log("WIPED ALL DATA");
      console.log("Response from background:", response);
    }
  } catch (error) {
    console.log("Error wiping all stored data: ", error);
  }
}

// ____________________-------_________________________________-------__________________________________

// Wait for DOM to load before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {
  //load only the main page first
  swapPage(0);

  // listeners etc go here - waiting to add until after the page has fully loaded
  const genKeysBtn = document.getElementById("genKeysBtn");
  // for key generation button
  if (genKeysBtn) {
    genKeysBtn.addEventListener("click", getNewKeyPair);
    console.log("Key generation button listener attached");
  } else {
    console.error("genKeysBtn not found in DOM");
  }

  const resetNumsBtn = document.getElementById("resetNumsBtn");
  if (resetNumsBtn) {
    resetNumsBtn.addEventListener("click", resetKGStorage);
    console.log("storage reset");
  } else {
    console.error("reset button not found");
  }

  const copyPubKGBtn = document.getElementById("copyPubKGBtn");
  if (copyPubKGBtn) {
    copyPubKGBtn.addEventListener("click", () => copyKGKey(true));
    console.log("copy KG pub btn");
  } else {
    console.log("copyKGpub button not found");
  }

  const copyPrivKGBtn = document.getElementById("copyPrivKGBtn");
  if (copyPrivKGBtn) {
    copyPrivKGBtn.addEventListener("click", () => copyKGKey(false));
    console.log("copy KG priv btn");
  } else {
    console.log("copyKGpriv button not found");
  }

  const delKGRowBtn = document.getElementById("deleteKGBtn");
  if (delKGRowBtn) {
    delKGRowBtn.addEventListener("click", delKGKey);
    console.log("delKGRow btn");
  } else {
    console.log("delKGRow btn not found");
  }

  const encryptBtn = document.getElementById("encBtn");
  if (encryptBtn) {
    encryptBtn.addEventListener("click", encryptFromButton);
    console.log("Encrypt button");
  } else {
    console.error("encrypt button not found");
  }

  const decBtn = document.getElementById("decBtn");
  if (decBtn) {
    decBtn.addEventListener("click", decryptFromButton);
    console.log("Decrypt btn");
  } else {
    console.log("decBtn not found");
  }

  const copyBtn = document.getElementById("cpyClip");
  var txtData = document.getElementById("outData");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(txtData.value);
        console.log("Written to clipboard");
      } catch (error) {
        console.log("Error copying to clipboard:", error);
      }
    });
  }

  // ------------ for nav bar swapping ---------------------
  const mainBtn = document.getElementById("mainBtn");
  if (mainBtn) {
    mainBtn.addEventListener("click", () => swapPage(0));
    console.log("Nav bttn 0");
  } else {
    console.error("nav bttn 0 not found");
  }

  const storBtn = document.getElementById("storBtn");
  if (storBtn) {
    storBtn.addEventListener("click", () => swapPage(1));
    console.log("Nav bttn 1");
  } else {
    console.error("nav bttn 1 not found");
  }

  const keyBtn = document.getElementById("keyBtn");
  if (keyBtn) {
    keyBtn.addEventListener("click", () => swapPage(2));
    console.log("Nav bttn 2");
  } else {
    console.error("nav bttn 2 not found");
  }

  const faqBtn = document.getElementById("faqBtn");
  if (faqBtn) {
    faqBtn.addEventListener("click", () => swapPage(3));
    console.log("Nav bttn 3");
  } else {
    console.error("nav bttn 3 not found");
  }
  //----------------------------------------------------------

  const wipeBtn = document.getElementById("dataWipeBtn");
  if (wipeBtn) {
    wipeBtn.addEventListener("click", wipeAllData);
    console.log("Wipe btn");
  } else {
    console.log("Wipe bttn not found");
  }

  const refPubSetBtn = document.getElementById("pkInBtn");
  if (refPubSetBtn) {
    refPubSetBtn.addEventListener("click", async () => {
      await setPubKeyTable();
      // clears the inputted values from the input boxes
      document.getElementById("refIn").value = "";
      document.getElementById("pkIn").value = "";
    });

    console.log("refPub btn");
  } else {
    console.log("refPub btn not found");
  }
});

console.log("\n--- popup.js completed ---\n");
