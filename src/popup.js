// Popup.js is used for front-end stuff
// shouldnt do kyber here and processing should be minimal
// use "chrome.runtime.sendMessage(...)" to send data/trigger background.js

// ---------------------------
// here function is defined to call a response from "background.js"
// listeners are added to the buttons once "DOMContentLoaded"
// output from functions are written into html and swapped with the current output

console.log("\n--- popup.js loading ---\n");

// Function to request new key pair
async function getNewKeyPair() {
  try {
    // call the backside genKeys method
    const response = await chrome.runtime.sendMessage({ action: "genKeys" });
    console.log("Response from background:", response);

    // if backside returns successfully then...
    if (response.success) {
      const output = `
        <strong>Key Pair Generated!</strong><br><br>
        Public Key Length: ${response.publicKeyLength} bytes<br>
        <small>Public Key (base64): ${response.publicKey.substring(
          0,
          50,
        )}...</small><br>

        Secret Key Length: ${response.secretKeyLength} bytes<br><br>
        <small>Secret Key (base64): ${response.secretKey.substring(
          0,
          50,
        )}...</small>
      `;

      // write the genKeys data to the output element
      document.getElementById("keyGenOutput").innerHTML = output;
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

// -------------------------------------------------------------------

async function getRanNum() {
  try {
    // call the backside genKeys method
    const response = await chrome.runtime.sendMessage({
      action: "randomNumber",
    });
    console.log("Response from background:", response);

    // if backside returns successfully then...
    if (response.success) {
      let output = `<p>Random Number: ${response.ranNum}</p>`;

      // if the stored numbers length isnt 0 then add the stored numbers to the output
      if (response.nHistory && response.nHistory.length > 0) {
        output += "<p>Stored numbers: " + response.nHistory.join(", ") + "</p>";
      }

      // write the genKeys data to the output element
      document.getElementById("ranNumOut").innerHTML = output;
    }

    //if there is an error then print that instead
    else {
      document.getElementById("ranNumOut").innerHTML =
        `<strong>Error:</strong> ${response.error}`;
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("ranNumOut").innerHTML =
      `<strong>Error:</strong> ${error.message}`;
  }
}

// for testing chrome.storage
async function resetHistory() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "resetRandomNumbers",
    });
    console.log("Response from background:", response);

    if (response.success) {
      document.getElementById("ranNumOut").innerHTML = "<p>History reset.</p>";
    } else {
      document.getElementById("ranNumOut").innerHTML =
        `<strong>Error:</strong> ${response.error}`;
    }
  } catch (err) {
    console.error(err);
  }
}

async function encryptFromButton() {
  try {
    // get the data given in the text box
    const userData = document.getElementById("inData").value;

    // send the action to background with the data in the payload
    const response = await chrome.runtime.sendMessage({
      action: "encryptMessage",
      payload: userData,
    });
    console.log("Response from background:", response);

    if (response.success) {
      console.log("YES");

      // format the returned data and put it in the ouput text box
      document.getElementById("outData").value = JSON.stringify(
        response,
        null,
        2,
      );
    } else {
      console.log("NO");
    }
  } catch (err) {
    console.error(err);
  }
}

// ____________________-------_________________________________-------__________________________________

// Wait for DOM to load before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {
  // listeners etc go here - waiting to add until after the page has fully loaded
  const genKeysBtn = document.getElementById("genKeysBtn");
  // for key generation button
  if (genKeysBtn) {
    genKeysBtn.addEventListener("click", getNewKeyPair);
    console.log("Key generation button listener attached");
  } else {
    console.error("genKeysBtn not found in DOM");
  }

  const ranNumBtn = document.getElementById("ranNumBtn");
  if (ranNumBtn) {
    ranNumBtn.addEventListener("click", getRanNum);
    console.log("random number button listener");
  } else {
    console.error("ranNumBttn not found");
  }

  const resetNumsBtn = document.getElementById("resetNumsBtn");
  if (resetNumsBtn) {
    resetNumsBtn.addEventListener("click", resetHistory);
    console.log("storage reset");
  } else {
    console.error("reset button not found");
  }

  const encryptBtn = document.getElementById("encBtn");
  if (encryptBtn) {
    encryptBtn.addEventListener("click", encryptFromButton);
    console.log("Encrypt button");
  } else {
    console.error("encrypt button not found");
  }
});

console.log("\n--- popup.js completed ---\n");
