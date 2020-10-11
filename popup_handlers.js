var searchbar = document.getElementById("searchbar");
console.log("hey there sugar");
searchbar.addEventListener('input', handleSearchInput);
browser.runtime.onMessage.addListener(handleSearchResponse);

function handleSearchInput(event) {
  const search_word = searchbar.input.toString().trim();
  browser.runtime.sendMessage({headword: search_word}).catch(err => console.error(err));
  console.log("sent message");
}

function handleSearchResponse(response) {
  var definition = document.getElementById('searchbar_definition');
  if (response.error) {
    definition.innerText = "Couldn't find matching entry :(";
  }

  return Promise.resolve({response: "All is well"});
}
