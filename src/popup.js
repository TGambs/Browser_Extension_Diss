// Popup.js is used for front-end stuff
// shouldnt do kyber here and processing should be minimal
// use "chrome.runtime.sendMessage(...)" to send data/trigger background.js

// Popup.js is used for front-end stuff
// shouldnt do kyber here and processing should be minimal
// use "chrome.runtime.sendMessage(...)" to send data/trigger background.js

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
          500
        )}...</small><br>

        Secret Key Length: ${response.secretKeyLength} bytes<br><br>
        <small>Secret Key (base64): ${response.secretKey.substring(
          0,
          500
        )}...</small>
      `;

      // write the genKeys data to the output element
      document.getElementById("keyGenOutput").innerHTML = output;
    }

    //if there is an error then print that instead
    else {
      document.getElementById(
        "keyGenOutput"
      ).innerHTML = `<strong>Error:</strong> ${response.error}`;
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById(
      "keyGenOutput"
    ).innerHTML = `<strong>Error:</strong> ${error.message}`;
  }
}

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
});

console.log("\n--- popup.js completed ---\n");
