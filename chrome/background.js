"use strict";

let api_key;
fetch("secrets.json")
  .then((response) => response.json())
  .then((json) => api_key = json.mw_api_key)

let popup_port;
chrome.runtime.onConnect.addListener(function(port) {
  popup_port = port
  popup_port.onMessage.addListener(handlePopupMessage);
});
chrome.runtime.onMessage.addListener(handleBookMessage);

function onCreated() {
  if (chrome.runtime.lastError) {
    console.error(`Error: ${chrome.runtime.lastError}`);
  } 
}

function onError(error) {
  console.error(error);
}


// chrome.contextMenus.create({
//   id: "log-selection",
//   title: "contextMenuItemSelectionLogger",
//   contexts: ["selection"]
// }, onCreated);

chrome.contextMenus.create({
  id: "lookup-selection",
  title: "Look up word",
  contexts: ["selection"]
}, onCreated);

chrome.contextMenus.onClicked.addListener((info, tab) => {
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

  chrome.tabs.sendMessage(
    tab.id,
    { error: !foundWord, content: dictEntry }
  );
}

function handleBookMessage(message) {
  let queryOptions = {active: true};
  chrome.tabs.query(queryOptions, tabList => merriamLookup(message.headword, tabList[0]));
}

function handlePopupMessage(message) {
  fetch(`https://dictionaryapi.com/api/v3/references/collegiate/json/${message.headword}?key=7c41540c-3178-41c3-838c-216c402fd175`).then(response => response.json()).catch(onError).then(response => {
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
