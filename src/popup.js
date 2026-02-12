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

// Shouldve been inline js but extensions arent allowed any
function swapPage(pgNum) {
  var mainP = document.getElementById("mainPgCont");
  var strgP = document.getElementById("storagePgCont");
  var faqP = document.getElementById("faqPgCont");

  mainP.style.display = "none";
  strgP.style.display = "none";
  faqP.style.display = "none";

  switch (pgNum) {
    case 0:
      mainP.style.display = "block";
      break;

    case 1:
      strgP.style.display = "block";
      break;

    case 2:
      faqP.style.display = "block";
      break;
  }
}

function copyToClip() {
  //select id to copy
  var txtData = document.getElementById("outData");
  var txt = txtData.value;

  // write the txt tot the clipboard
  navigator.clipboard.writeText(txt);

  alert("Text copied");
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

  /*
  const ranNumBtn = document.getElementById("ranNumBtn");
  if (ranNumBtn) {
    ranNumBtn.addEventListener("click", getRanNum);
    console.log("random number button listener");
  } else {
    console.error("ranNumBttn not found");
  }*/

  /*
  const resetNumsBtn = document.getElementById("resetNumsBtn");
  if (resetNumsBtn) {
    resetNumsBtn.addEventListener("click", resetHistory);
    console.log("storage reset");
  } else {
    console.error("reset button not found");
  }*/

  const encryptBtn = document.getElementById("encBtn");
  if (encryptBtn) {
    encryptBtn.addEventListener("click", encryptFromButton);
    console.log("Encrypt button");
  } else {
    console.error("encrypt button not found");
  }

  // for nav bar swapping
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

  const faqBtn = document.getElementById("faqBtn");
  if (faqBtn) {
    faqBtn.addEventListener("click", () => swapPage(2));
    console.log("Nav bttn 2");
  } else {
    console.error("nav bttn 2 not found");
  }
});

console.log("\n--- popup.js completed ---\n");
