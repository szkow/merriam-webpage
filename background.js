function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
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
      console.log(`Looking up ${info.selectionText}...`);
      merriamLookup(info.selectionText);
      console.log("done!");
      break;
  }
});

function merriamLookup(word) {
  fetch(`https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=7c41540c-3178-41c3-838c-216c402fd175`).then(response => response.json()).then(workResponse).catch(err => console.error(err));
}

function workResponse(response) {

}