"use strict";

browser.runtime.onMessage.addListener(request => {
  console.log("Message from the background script:");
  console.log(request.content);
  createPopup(request.content);
  return Promise.resolve({response: "Hi from content script"});
});

function createPopup(dictEntry) {
  
}