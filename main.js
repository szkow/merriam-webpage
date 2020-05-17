"use strict";

browser.runtime.onMessage.addListener(request => {
  console.log("Message from the background script:");
  console.log(request.content);
  createPopup(request.content);
  return Promise.resolve({response: "Hi from content script"});
});

function createPopup(dictEntry) {
  // Extract the content we need
  const word = dictEntry["meta"]["id"];
  const short = dictEntry["shortdef"];

  // Find coordinates of word on page
  // const position = getSelectionCoords(window);
  const selection = window.getSelection();
  const anchorOffset = selection.anchorOffset;
  const anchor = selection.anchorNode;
  const parentAnchor = anchor.parentNode;
  const boundingRect = selection.getRangeAt(0).getBoundingClientRect();

  // Create the node
  var node = document.createElement("div");
  var content = document.createTextNode(word + "\n\n" + short[0]);
  node.appendChild(content);

  node.style.position = "absolute";
  node.style.left = `${boundingRect.x + window.scrollX - 0.5 * node.clientWidth}px`;
  node.style.top = `${boundingRect.y + window.scrollY}px`;
  node.style.border = "solid red 20px";
  
  // parentAnchor.insertBefore(node, anchor);
  document.body.append(node);
}

// From https://stackoverflow.com/questions/6846230/coordinates-of-selected-text-in-browser-page 
function getSelectionCoords(win) {
  win = win || window;
  var doc = win.document;
  var sel = doc.selection, range, rects, rect;
  var x = 0, y = 0;
  if (sel) {
    if (sel.type != "Control") {
      range = sel.createRange();
      range.collapse(true);
      x = range.boundingLeft;
      y = range.boundingTop;
    }
  } else if (win.getSelection) {
    sel = win.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0).cloneRange();
      if (range.getClientRects) {
        range.collapse(true);
        rects = range.getClientRects();
        if (rects.length > 0) {
          rect = rects[0];
        }
        x = rect.left;
        y = rect.top;
      }
    }
  }
  return {x: x, y: y};
}