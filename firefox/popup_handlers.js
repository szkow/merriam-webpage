var searchbar = document.getElementById("searchbar");
let background_port = browser.runtime.connect({name: "popup-port"});
browser.runtime.onMessage.addListener(handleSearchResponse);
background_port.onMessage.addListener(fillPopup);

searchbar.onkeypress = function(e) {
  if (!e) e = window.event;
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13){ // Only search when pressing enter
    var search_word = searchbar.value.toString().trim();
    if (search_word != "")
      background_port.postMessage({headword: search_word});
  }
}

function handleSearchResponse(response) {
  var definition = document.getElementById('searchbar_definition');
  console.log("hey i'm in the thing handling the response");
  fillPopup(response);
}

function fillPopup(message) {
  const dictEntry = message.content;

  // Find refs to the elements we need
  var definition_list = document.getElementById("definition_list");
  var headword = document.getElementById("headword");
  var link = document.getElementById("link");

  // Clear old definitions
  var definitions = definition_list.querySelectorAll("dd");
  definitions.forEach((node) => {
    definition_list.removeChild(node);
  });

  // Update the content
  if (message.error) {
    headword.innerText = "Couldn't find matching entry :(";
    link.style.pointerEvents = "none";
  } else {
    link.style.pointerEvents = "all";

    // Extract the content we need
    const word = dictEntry["hwi"]["hw"].replaceAll("*", "\u00B7");
    const short = dictEntry["shortdef"];

    // Fill the existing definition element
    headword.innerText = word;
    // definitionElement.definition.innerText = short;
    short.forEach((def, index) => {
      var dd = document.createElement("dd");
      if (short.length > 1) {
        dd.innerText = (index + 1) + ". " + def;
      } else {
        dd.innerText = def;
      }
      definition_list.appendChild(dd);
    });

    const index = word.indexOf(":");
    if (index < 0) {
      link.href = `https://www.merriam-webster.com/dictionary/${word.replaceAll("\u00B7", "")}`;
    } else {
      link.href = `https://www.merriam-webster.com/dictionary/${word.replaceAll("\u00B7", "").substring(0, index)}`;
    }
  }

  // Style the element
  // const selection = window.getSelection();
  // const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
  // container.style.left = `${boundingRect.x + window.scrollX - 0.5 * container.clientWidth}px`;
  // container.style.top = `calc(${boundingRect.y + window.scrollY - container.clientHeight}px - 1ch)`;
  // container.style.maxWidth = `${Math.min(boundingRect.x + window.scrollX, Math.min(window.innerWidth - (boundingRect.x + window.scrollX), kMaxDefinitionWidthPercent * window.innerWidth))}px`;

  // definitionIsHidden = false;
  // updateVisibility();
}
