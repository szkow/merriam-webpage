"use strict";

function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
}

function onError(error) {
  console.error(`Error: ${error}`);
}


browser.contextMenus.create({
  id: "log-selection",
  title: "contextMenuItemSelectionLogger",
  contexts: ["selection"]
}, onCreated);

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
      merriamLookup(word);
      console.log("done!");
      break;
  }
});

// Makes an HTTP request to Merriam-Webster's API
function merriamLookup(word) {
  fetch(`https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=7c41540c-3178-41c3-838c-216c402fd175`).then(response => response.json()).then(makeNode).catch(onError);
}

// Takes in a JSON object which is the dictionary entry for the selected word
function makeNode(response) {
  // Use only the first match for simplicity
  const dictEntry = response[0];

  console.log(dictEntry);
  const word = dictEntry["meta"]["id"];
  const short = dictEntry["shortdef"];

  // Create the node
  // var node = document.createElement("div");
  // var content = document.createTextNode(word + "\n\n" + short[0]);
  // node.appendChild(content);

  // // node.style.position = "absolute";
  // node.style.border = "solid red 20px";
  
  // document.body.append(node);

  browser.tabs.query({
    currentWindow: true,
    active: true
  }).then(tabs => {
    for (let tab of tabs) {
      browser.tabs.sendMessage(
        tab.id,
        {content: dictEntry}
      ).then(response => {
        console.log("Message from the content script:");
        console.log(response.response);
      }).catch(onError);
    }
  }).catch(onError);
}


function sendMessageToTabs(tabs) {
  for (let tab of tabs) {
    browser.tabs.sendMessage(
      tab.id,
      {greeting: "Hi from background script"}
    ).then(response => {
      console.log("Message from the content script:");
      console.log(response.response);
    }).catch(onError);
  }
}
