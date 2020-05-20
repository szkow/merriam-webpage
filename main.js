"use strict";

const kMaxDefinitionWidthPercent = 0.3;

var definitionElement = null;
var definitionIsHidden = true;
var bookElement = null;
// console.log(bookElement);
var bookIsHidden = true;

createBookElement();
bookElement.addEventListener("click", handleBookClick);
document.addEventListener("click", handleClick);
document.addEventListener("selectionchange", handleSelectionChange);

browser.runtime.onMessage.addListener(request => {
  if (definitionElement == null) {
    createDefinitionElement();
  }
  emptyDefinitionElement();
  fillDefinitionElement(request);
  return Promise.resolve({response: "Hi from content script"});
});

function createBookElement() {
  // Make the element
  var book = document.createElement("div");
  var bookImage = document.createElement("i");
  bookImage.className = "fas fa-book";
  book.append(bookImage);

  // Style it
  book.style.position = "absolute";
  book.style.zIndex = 0;
  book.style.cursor = "pointer";
  book.style.visibility = "hidden";
  book.style["-moz-user-select"] = "none";
  book.style["-webkit-user-select"] = "none";
  book.style["-ms-user-select"] = "none";
  book.style["user-select"] = "none";


  // Add to document
  bookElement = book;
  document.body.appendChild(book);
}

/*
 * HTML layout:
 *    <div>
 *      <dl>
 *        <dt> WORD </dt> 
 *        <span>LINK</span>
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
  var link = document.createElement("a");
  var span = document.createElement("span");
  var definition = document.createElement("dd");
  container.appendChild(definitionList);
  definitionList.appendChild(word);
  definitionList.appendChild(span);
  span.appendChild(link);
  definitionList.appendChild(definition);

  link.innerText = ">>";

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
  // span.style.fontSize = "x-small";
  span.style.paddingLeft = "0.7em";
  span.style.display = "relative";
  span.style.bottom = "1em";
  link.target = "_blank";
  word.style.display = "inline";

  // Update our global variable
  definitionElement = { container: container, word: word, span: span, definition: definition };
  document.body.append(definitionElement.container);
}

function fillDefinitionElement(message) {
  const dictEntry = message.content;
  var container = definitionElement.container;
  var definitionList = container.firstChild;

  if (message.error) {
    definitionElement.word.innerText = "Couldn't find matching entry :(";
    definitionElement.span.style.visibility = "hidden";
  } else {
    definitionElement.span.style.visibility = "inherit";
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

    const index = word.indexOf(":");
    if (index < 0) {
      definitionElement.span.firstChild.href = `https://www.merriam-webster.com/dictionary/${word.replace("*", "")}`;
    } else {
      definitionElement.span.firstChild.href = `https://www.merriam-webster.com/dictionary/${word.replace("*", "").substring(0, index)}`;
    }
  }

  // Style the element
  const selection = window.getSelection();
  const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
  container.style.left = `${boundingRect.x + window.scrollX - 0.5 * container.clientWidth}px`;
  container.style.top = `calc(${boundingRect.y + window.scrollY - container.clientHeight}px - 1ch)`;
  container.style.maxWidth = `${Math.min(boundingRect.x + window.scrollX, Math.min(window.innerWidth - (boundingRect.x + window.scrollX), kMaxDefinitionWidthPercent * window.innerWidth))}px`;

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
  if (mouseEvent.target != definitionElement.container && mouseEvent.target != definitionElement.definition && mouseEvent.target != definitionElement.word && mouseEvent.target != bookElement) {
    definitionIsHidden = true;
    updateVisibility();
  }
}

function handleBookClick(mouseEvent) {
  console.log("I got clicked!");
  const selection = window.getSelection();
  const word = selection.getRangeAt(0).toString().trim();

  // Send the selected word to the background script
  browser.runtime.sendMessage({headword: word}).catch(err => console.error(err));
  bookElement.style.visibility = "hidden";
}

function handleSelectionChange(event) {
  const selection = window.getSelection();
  const word = selection.getRangeAt(0).toString().trim();

  // Check if our selection contains only one word
  if (!word.includes(" ") && word.length > 0) {
    // Move the dictionary icon
    const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
    bookElement.style.left = `calc(${boundingRect.x + window.scrollX}px - 1ch)`;
    bookElement.style.top = `calc(${boundingRect.y + window.scrollY - bookElement.clientHeight}px - 3px)`;

    // console.log(`x: ${boundingRect.x + window.scrollX}, y: ${boundingRect.y + window.scrollY}`)
    // Show the icon
    bookElement.style.visibility = "visible";
  } else {
    bookElement.style.visibility = "hidden";
  }
}