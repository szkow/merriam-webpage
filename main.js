"use strict";

var definitionElement = null;
var isHidden = true;

document.addEventListener("click", handleClick);

browser.runtime.onMessage.addListener(request => {
  console.log("Message from the background script:");
  console.log(request.content);
  if (definitionElement == null) {
    createDefinitionElement(request.content);
  } 
  fillDefinitionElement(request.content);
  return Promise.resolve({response: "Hi from content script"});
});

/*
 * HTML layout:
 *    <div>
 *      <dl>
 *        <dt> WORD </dt>
 *        <dd> DEF 1 </dd>
 *        <dd> DEF 2 </dd>
 *             . . .
 *      </dl>
 *    </div>
 */
function createDefinitionElement() {
  // Find coordinates of word on page
  // const position = getSelectionCoords(window);
  const selection = window.getSelection();
  const anchorOffset = selection.anchorOffset;
  const anchor = selection.anchorNode;
  const parentAnchor = anchor.parentNode;
  const boundingRect = selection.getRangeAt(0).getBoundingClientRect();

  /* 
   * Create the element
   * We leave the definitions in the <dt> tag undefined, since the number of definitions
   * changes for each word.
   */
  var container = document.createElement("div");
  var definitionList = document.createElement("dl");
  var word = document.createElement("dt");
  var definition = document.createElement("dd");
  container.appendChild(definitionList);
  definitionList.appendChild(word);
  definitionList.appendChild(definition);


  // Style the element
  container.style.position = "absolute";
  container.style.maxWidth = "30%";
  container.style.color = "black";
  container.style.background = "rgba(255,255,255,0.3)";
  container.style.backdropFilter = "blur(4px)";
  container.style.border = "solid black 1px";
  container.style.borderRadius = "3px";
  container.style.padding = "10px";
  container.style.visibility = "hidden";
  // container.style.pointerEvents = "all";

  // Update our global variable
  definitionElement = { container: container, word: word, definition: definition };
  document.body.append(definitionElement.container);
}

function fillDefinitionElement(dictEntry) {
  var container = definitionElement.container;

  // Extract the content we need
  const word = dictEntry["meta"]["id"];
  const short = dictEntry["shortdef"];

  // Fill the existing definition element
  definitionElement.word.innerHTML = word;
  definitionElement.definition.innerHTML = short;

  // Style the element
  const selection = window.getSelection();
  const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
  container.style.left = `${boundingRect.x + window.scrollX - 0.5 * container.clientWidth}px`;
  container.style.top = `${boundingRect.y + window.scrollY - container.clientHeight}px`;

  isHidden = false;
  updateVisibility();
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

function updateVisibility() {
  if (isHidden) {
    definitionElement.container.style.visibility = "hidden";
    definitionElement.container.style["backdrop-filter"] = "none";
  } else {
    definitionElement.container.style.visibility = "visible";
    definitionElement.container.style["backdrop-filter"] = "blur(4px)";
  }
}

function handleClick(mouseEvent) {
  if (mouseEvent.target != definitionElement.container && mouseEvent.target != definitionElement.definition && mouseEvent.target != definitionElement.word) {
    isHidden = true;
    updateVisibility();
  }
}