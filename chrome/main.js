"use strict";

const kMaxDefinitionWidthPercent = 0.3;

var definitionElement = null;
var definitionIsHidden = true;
var mouseDownPosition = { x: -1, y: -1 };
var definitionIsDragging = false;
var bookElement = null;
var bookIsHidden = true;

createBookElement();
bookElement.addEventListener("click", handleBookClick);
document.addEventListener("click", handleDocumentClick);
document.addEventListener("selectionchange", handleSelectionChange);

// Lookup request handler
chrome.runtime.onMessage.addListener(request => {
  if (definitionElement == null)
    createDefinitionElement();

  emptyDefinitionElement();
  fillDefinitionElement(request);
  return Promise.resolve({response: "All is well"});
});

function createBookElement() {
  // Make the element
  var book = document.createElement("div");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.runtime.getURL("book-solid.svg"), false);
  xhr.overrideMimeType("image/svg+xml");
  xhr.onload = (e) => {
    book.appendChild(xhr.responseXML.documentElement);
  }
  xhr.send("");

  // Style it
  book.className = "merriamswebpage-bookicon";
  book.style.visibility = "hidden";

  // Add to document
  bookElement = book;
  document.body.appendChild(book);
}

/*
 * HTML layout:
 *    <div>
 *      <dl>
 *        <dt> WORD </dt> 
 *        <span><a><svg>...</svg></a></span>
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

  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.runtime.getURL("chevron-circle-right-solid.svg"), false);
  xhr.overrideMimeType("image/svg+xml");
  xhr.onload = (e) => {
    link.appendChild(xhr.responseXML.documentElement);
  }
  xhr.send("");

  var definition = document.createElement("dd");
  container.appendChild(definitionList);
  definitionList.appendChild(word);
  definitionList.appendChild(span);
  span.appendChild(link);
  definitionList.appendChild(definition);

  // Style the element
  container.className = "merriamswebpage-container";
  link.target = "_blank";
  link.title = "View full entry";
  container.style.visibility = "hidden";

   // Stop clicks inside the element from closing the window
   container.addEventListener("click", event => event.stopPropagation());

   // Allow user to drag definition
   container.addEventListener("mousedown", event => { 
     if (event.target != container && container.contains(event.target))
       return;
     mouseDownPosition = { x: event.offsetX, y: event.offsetY }; 
     definitionIsDragging = true; 
   });
   container.addEventListener("mouseup",   () => { 
     mouseDownPosition = { x: -1, y: -1 };
     definitionIsDragging = false;
   });
   document.addEventListener("mousemove", 
     function (event) {
       if (!definitionIsHidden && definitionIsDragging) {
         event.stopPropagation();
         const x = event.pageX - mouseDownPosition.x;
         const y = event.pageY - mouseDownPosition.y;
         container.style.left = `${x}px`;
         container.style.top = `${y}px`;
       }
     }
   );
 
  // Update our global variable
  definitionElement = { container: container, word: word, span: span, definition: definition };
  document.body.append(definitionElement.container);
}

function fillDefinitionElement(message) {
  const dictEntry = message.content;
  var container = definitionElement.container;
  var definitionList = container.firstChild;

  if (message.error) {
    definitionElement.word.innerText = "Couldn't find word";
    definitionElement.span.style.visibility = "hidden";
  } else {
    definitionElement.span.style.visibility = "inherit";
    // Extract the content we need
    const word = dictEntry["hwi"]["hw"].replaceAll("*", "\u00B7");
    const short = dictEntry["shortdef"];

    // Fill the existing definition element
    if (short.length == 0) {
      definitionElement.word.innerText = "No short definition available, view full entry";
    }
    else {
      definitionElement.word.innerText = word;
      definitionElement.definition.innerText = short;
      let draw_nums = short.every(def => def[0] != "—")
      short.forEach((def, index) => {
        var dd = document.createElement("dd");
        if (short.length > 1) {
          var def_number = document.createElement("b");
          if (draw_nums)
            def_number.innerText = `${index + 1}`;
          dd.appendChild(def_number);
          def_number.after(def);
        } else {
          dd.innerText = def;
        }
        definitionList.appendChild(dd);
      });
    }

    const index = word.indexOf(":");
    if (index < 0) {
      definitionElement.span.firstChild.href = `https://www.merriam-webster.com/dictionary/${word.replaceAll("\u00B7", "")}`;
    } else {
      definitionElement.span.firstChild.href = `https://www.merriam-webster.com/dictionary/${word.replaceAll("\u00B7", "").substring(0, index)}`;
    }
  }

  // Style the element
  definitionIsHidden = false;
  updateVisibility();

  const selection = window.getSelection();
  const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
   const x = boundingRect.x + window.scrollX - 0.5 * container.clientWidth;
  const y = boundingRect.y + window.scrollY - container.clientHeight - 5; // The -5 is approx. height of a line
  container.style.left = `${x}px`;
  container.style.top = `${y}px`; 
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

function handleDocumentClick(mouseEvent) {
  definitionIsHidden = true;
  updateVisibility();
}

function handleBookClick(mouseEvent) {
  const selection = window.getSelection();
  const word = selection.getRangeAt(0).toString().trim();

  // Send the selected word to the background script
  chrome.runtime.sendMessage({headword: word});
  bookElement.style.visibility = "hidden";
  mouseEvent.stopPropagation();
}

function handleSelectionChange(event) {
  if (definitionElement == null)
  createDefinitionElement();

  const selection = window.getSelection();
  const word = selection.getRangeAt(0).toString().trim();

  if (definitionElement.container.contains(selection.anchorNode))
  return;

  // Check if our selection contains only one word
  if (!word.includes(" ") && word.length > 0) {
    // Move the dictionary icon
    const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
    bookElement.style.left = `calc(${boundingRect.x + window.scrollX}px - 1em)`;
    bookElement.style.top = `calc(${boundingRect.y + window.scrollY - bookElement.clientHeight}px - 1ch)`;

    // Show the icon
    bookElement.title = `Look up "${word}"`;
    bookElement.style.visibility = "visible";
  } else {
    bookElement.style.visibility = "hidden";
  }
}