"use strict";

var definitionElement = null;
var definitionIsHidden = true;
var bookElement = createBookElement();
// console.log(bookElement);
var bookIsHidden = true;

// bookElement.addEventListener("click", handleBookClick);
document.addEventListener("click", handleClick);
document.addEventListener("selectionchange", handleSelectionChange);

browser.runtime.onMessage.addListener(request => {
  console.log("Message from the background script:");
  console.log(request.content);
  if (definitionElement == null) {
    createDefinitionElement(request.content);
  } 
  emptyDefinitionElement();
  fillDefinitionElement(request.content);
  return Promise.resolve({response: "Hi from content script"});
});

function createBookElement() {
  // Make the element
  var book = document.createElement("div");
  book.innerHTML = "MW";

  // Style it
  book.style.position = "absolute";
  book.style.visibility = "hidden";

  // Add to document
  document.body.append(book);
  return book;
}

/*
 * HTML layout:
 *    <div>
 *      <dl>
 *        <dt> WORD </dt>
 *        <dd> DEF 1 </dd>
 *        <dd> DEF 2 </dd>
 *             . . .
 *      </dl>
 *      <a> LINK TO DICTIONARY </a>
 *    </div>
 */
function createDefinitionElement() {
  // Find coordinates of word on page
  // const position = getSelectionCoords(window);
  const selection = window.getSelection();
  const anchorOffset = selection.anchorOffset;
  const anchor = selection.anchorNode;
  const parentAnchor = anchor.parentNode;

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
  container.style.background = "rgba(255,255,255,0.45)";
  container.style.backdropFilter = "blur(4px)";
  container.style.border = "solid black 1px";
  container.style.borderRadius = "3px";
  container.style.padding = "5px 10px";
  container.style.visibility = "hidden";

  // Update our global variable
  definitionElement = { container: container, word: word, definition: definition };
  document.body.append(definitionElement.container);
}

function fillDefinitionElement(dictEntry) {
  var container = definitionElement.container;
  var definitionList = container.firstChild;

  // Extract the content we need
  const word = dictEntry["hwi"]["hw"];
  const short = dictEntry["shortdef"];

  // Fill the existing definition element
  definitionElement.word.innerText = word;
  definitionElement.definition.innerText = short;
  short.forEach((def, index) => {
    var dd = document.createElement("dd");
    if (short.length > 1) {
      dd.innerText = (index + 1) + ". " + def;
    } else {
      dd.innerText = def;
    }
    definitionList.appendChild(dd);
  });

  // Style the element
  const selection = window.getSelection();
  const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
  container.style.left = `${boundingRect.x + window.scrollX - 0.5 * container.clientWidth}px`;
  container.style.top = `calc(${boundingRect.y + window.scrollY - container.clientHeight}px - 1ch)`;

  definitionIsHidden = false;
  updateVisibility();
}

function emptyDefinitionElement() {
  var definitions = definitionElement.container.querySelectorAll("dd");
  definitions.forEach((node) => {
    definitionElement.container.firstChild.removeChild(node);
  });
}

function updateVisibility() {
  if (definitionIsHidden) {
    definitionElement.container.style.visibility = "hidden";
    definitionElement.container.style["backdrop-filter"] = "none";
  } else {
    definitionElement.container.style.visibility = "visible";
    definitionElement.container.style["backdrop-filter"] = "blur(4px)";
  }
}

function handleClick(mouseEvent) {
  if (mouseEvent.target != definitionElement.container && mouseEvent.target != definitionElement.definition && mouseEvent.target != definitionElement.word) {
    definitionIsHidden = true;
    updateVisibility();
    // bookElement.style.visibility = "hidden";
  }
}

function handleBookClick(mouseEvent) {

}

function handleSelectionChange() {
  const selection = window.getSelection();
  const word = selection.getRangeAt(0).toString().trim();

  // Check if our selection contains only one word
  if (!word.includes(" ")) {
    // Move the dictionary icon
    const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
    bookElement.style.left = `${boundingRect.x + window.scrollX}px`;
    bookElement.style.top = `calc(${boundingRect.y + window.scrollY}px - 1ch)`;

    // console.log(`x: ${boundingRect.x + window.scrollX}, y: ${boundingRect.y + window.scrollY}`)
    // Show the icon
    bookElement.style.visibility = "visible";
  } else {
    bookElement.style.visibility = "hidden";
  }
}