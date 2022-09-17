"use strict";

const api_key = "null";
fetch("../secrets.json")
  .then(response => response.json())
  .then(json => api_key = json.mw_api_key)
  .catch(onError)

let popup_port;
browser.runtime.onConnect.addListener(function(port) {
  popup_port = port
  popup_port.onMessage.addListener(handlePopupMessage);
});
browser.runtime.onMessage.addListener(handleBookMessage);

function onCreated() {
  if (browser.runtime.lastError) {
    console.error(`Error: ${browser.runtime.lastError}`);
  } 
}

function onError(error) {
  console.error(error);
}


// browser.contextMenus.create({
//   id: "log-selection",
//   title: "contextMenuItemSelectionLogger",
//   contexts: ["selection"]
// }, onCreated);

browser.contextMenus.create({
  id: "lookup-selection",
  title: "Look up word",
  contexts: ["selection"]
}, onCreated);

browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "log-selection":
      break; // This was just for debugging
    case "lookup-selection":
      // Preprocess selected text
      const word = info.selectionText.trim().split(' ')[0];

      // Perform the lookup
      merriamLookup(word, tab);
      break;
  }
});

// Makes an HTTP request to Merriam-Webster's API
function merriamLookup(word, tab) {
  fetch(`https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${api_key}`).then(response => response.json()).catch(onError).then(response => sendEntry(response, tab));
}

// Takes in a JSON object which is the dictionary entry for the selected word
function sendEntry(response, tab) {
  var foundWord;
  var dictEntry;
  // console.log(response);

  if (response == null || response.length == 0 || typeof(response[0]) != 'object') {
    foundWord = false;
    dictEntry = null;
  } else {
    foundWord = true;
    dictEntry = response[0];
  }

  browser.tabs.sendMessage(
    tab.id,
    { error: !foundWord, content: dictEntry }
  ).catch(onError);
}

function handleBookMessage(message) {
  browser.tabs.query({active: true}).then(tabList => merriamLookup(message.headword, tabList[0])).catch(onError);
}

function handlePopupMessage(message) {
  fetch(`https://dictionaryapi.com/api/v3/references/collegiate/json/${message.headword}?key=${api_key}`).then(response => response.json()).catch(onError).then(response => {
    var foundWord;
    var dictEntry;
    // console.log(response);
  
    if (response == null || response.length == 0 || typeof(response[0]) != 'object') {
      foundWord = false;
      dictEntry = null;
    } else {
      foundWord = true;
      dictEntry = response[0];
    }
  
    popup_port.postMessage({ error: !foundWord, content: dictEntry })
  });
}
