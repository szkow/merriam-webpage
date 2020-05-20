"use strict";

browser.runtime.onMessage.addListener(handleBookMessage);

function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
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
  // console.log("Entered listener");
  switch (info.menuItemId) {
    case "log-selection":
      console.log(info.selectionText);
      // console.log("oh boy i did a thing");
      break;
    case "lookup-selection":
      // Preprocess selected text
      const word = info.selectionText.trim().split(' ')[0];

      // Perform the lookup
      console.log(`Looking up ${word}...`);
      merriamLookup(word, tab);
      console.log("done!");
      break;
  }
});

// Makes an HTTP request to Merriam-Webster's API
function merriamLookup(word, tab) {
  fetch(`https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=7c41540c-3178-41c3-838c-216c402fd175`).then(response => response.json()).catch(onError).then(response => sendEntry(response, tab));
}

// Takes in a JSON object which is the dictionary entry for the selected word
function sendEntry(response, tab) {
  var foundWord;
  var dictEntry;
  console.log(response);

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