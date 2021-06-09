const prompts = [ "adroit", "susurrus", "exarch", "ophidian", "mercurial", "phonetic", "dictionary", "anfractuous", "colleague", "peach", "rigmarole", "didactic", "glean", "solipsism", "bumptious", "enjoin", "fustian", "abjure", "conciliatory", "succumb", "wigged-out", "pertain", "moxie", "hare" ];
var background_port = null;
const max_history_length = 5;
search_history = [];

window.addEventListener("load", function () {
  var searchbar = document.getElementById("searchbar");
  background_port = chrome.runtime.connect({name: "popup-port"});
  chrome.runtime.onMessage.addListener(fillPopup);
  background_port.onMessage.addListener(fillPopup);

  // Load a random prompt
  const date = new Date();
  searchbar.placeholder = prompts[(date.getDate() - 1) % prompts.length];

  // Search callback
  searchbar.onkeypress = function(e) {
    if (!e) e = window.event;
    if (e.key == "Enter"){ // Only search when pressing enter
      var search_word = searchbar.value.toString().trim();
      if (search_word != "")
        background_port.postMessage({headword: search_word});
    }
  }

  // Load search history
  chrome.storage.local.get("merriamswebpage_history", function (history) {
    if (history === undefined || Object.keys(history).length === 0) {
      search_history = [];
    }
    else {
      search_history = history.merriamswebpage_history;
    }
    updateSearchHistory();
  });
});

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
    link.style.visibility = "hidden";
  } else {
    // Extract the content we need
    const word = dictEntry["hwi"]["hw"].replaceAll("*", "\u00B7");
    const short = dictEntry["shortdef"];

    // Register search history
    const search_word = word.replaceAll("\u00B7", "");
    const exists = search_history.indexOf(search_word);
    if (exists != -1) {
      search_history.splice(exists, 1); // Remove word if already exists
      search_history.unshift(search_word);
    }
    else if (search_history.unshift(search_word) > max_history_length) {
      search_history.pop();
    }
    updateSearchHistory();
    
    if (short.length == 0) {
      word.innerText = "No short definition available, view full entry online";
    }
    else {
      // Fill the existing definition element
      headword.innerText = word;
      // definitionElement.definition.innerText = short;
      short.forEach((def, index) => {
        var dd = document.createElement("dd");
        if (short.length > 1) {
          var bold = document.createElement("b");
          bold.innerText = `${index + 1}`;
          dd.appendChild(bold);
          bold.after(def);
        } else {
          dd.innerText = def;
        }
        definition_list.appendChild(dd);
      });
    }

    const index = word.indexOf(":");
    if (index < 0) {
      link.href = `https://www.merriam-webster.com/dictionary/${word.replaceAll("\u00B7", "")}`;
    } else {
      link.href = `https://www.merriam-webster.com/dictionary/${word.replaceAll("\u00B7", "").substring(0, index)}`;
    }

    link.style.visibility = "visible";
  }

}

function updateSearchHistory() {
    // Push to memory
    merriamswebpage_history =  search_history;
    chrome.storage.local.set({merriamswebpage_history});

    // Clear old entries
    var history_container = document.getElementById("search-history");
    var history = history_container.querySelectorAll("div");
    history.forEach((node) => {
      history_container.removeChild(node);
    });

    // Create new divs
    for (let i = 0; i < search_history.length; i++) {
      let entry = document.createElement("div");
      entry.innerText = search_history[i];
      history_container.append(entry);

      // Give them event listeners
      entry.addEventListener("click", function (event) {
        var searchbar = document.getElementById("searchbar");
        searchbar.value = entry.innerText;
        background_port.postMessage({headword: entry.innerText});
      });
    }

}
