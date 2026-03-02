console.log("script loaded")
let lastMouseEvent = null
document.addEventListener("mousemove",(e1) => {
  lastMouseEvent = e1
})
document.addEventListener('keydown',(e2) => {
    if(e2.shiftKey) {
        if (!lastMouseEvent) return;
        const word = getWordFromMouse(lastMouseEvent)
        if (word && word.length > 0) {
            fetchDefinition(word);
        } else {
          console.log("Could not fetch word")
        }
    }
});

function getWordFromMouse(word) {
  console.log(word)
  let caret;
  if (document.caretPositionFromPoint) {
    caret = document.caretPositionFromPoint(word.clientX,word.clientY)
  } else if (document.caretRangeFromPoint) {
  let range = document.caretRangeFromPoint(word.clientX, word.clientY);
  caret = { offsetNode: range.startContainer, offset: range.startOffset };
}
  console.log("at get word from mouse")
  const node = caret.offsetNode
  const offset = caret.offset
  if (node.nodeType !== Node.TEXT_NODE) return null
  const text = node.textContent
  let start = offset
  let end = offset
  while (start > 0 && /\w/.test(text[start-1])) start--
  while (end < text.length && /\w/.test(text[end])) end++
  return text.slice(start,end) || null
}

function fetchDefinition(word) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  fetch(apiUrl)
    .then(async response => {
      if (response.status === 404) {
        const fuzzyWord = await awaitMes("levanshtein",word).then(fuzzies => {return fuzzies});
        const newUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${fuzzyWord}`
        console.log("levanshtein'd to " + fuzzyWord)
        const newResponse = fetch(newUrl).then(e => {return e.json()})
        return newResponse
      }
      return response.json()
    })
    .then(data => {
      if (!data) return;
      // 2. Display the result
    const word = data[0].word
    const phonetics = data[0].phonetic
    const definition = data[0].meanings[0].definitions[0].definition
  if (word) showTooltip(word, definition, phonetics)
  else console.log("no word")
      }
    )
}

function showTooltip(word, definition = "bruh", phonetics = "") {
  // Remove existing tooltip if any
  
  const existing = document.getElementById('my-custom-tooltip');
  if (existing) existing.remove();

  // Create new tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'my-custom-tooltip';
  tooltip.style.position = 'fixed';
  tooltip.style.top = '20px';
  tooltip.style.right = '20px';
  tooltip.style.backgroundColor = '#333';
  tooltip.style.color = '#fff';
  tooltip.style.padding = '15px';
  tooltip.style.zIndex = '10000';
  tooltip.style.borderRadius = '5px';
  
  // Add the "AI Explain" button logic here later
  tooltip.innerHTML = `<p><strong>${word}</strong></p>`
  if (phonetics !== "") tooltip.innerHTML += `<p>${phonetics}</p>`
  tooltip.innerHTML += `<p>${definition}</p><button id="ai-btn">AI Explain</button>`;
  tooltip.innerHTML += `<button id="sign-btn">Sign in</button>`;

  document.body.appendChild(tooltip);
  document.getElementById('ai-btn').addEventListener('click', () => {
     console.log("Trigger AI explanation...");
  });

  document.addEventListener('click', (e) => {
    if (e.target.id === 'sign-btn') {
        if (document.getElementById('create-acc-btn')) toggleElement(tooltip, 'create-acc-container');
        toggleElement(tooltip, 'login-container');
    }
    else if (e.target.id === 'create-acc-btn') {
        toggleElement(tooltip, 'create-acc-container');
    }
    else if (e.target.id === 'create-btn') {
      const credentials = getEmailAndPassword()
      ;(async () => {await awaitMes("createUserWithEmailAndPassword",credentials)})();
    }
    });
    function toggleElement(parent, id) {
    const el = document.getElementById(id);
    !el ? render(parent, id) : parent.removeChild(el);
    }
    function getEmailAndPassword() {
      return {
        email: document.querySelector("#user").value, 
        pass: document.querySelector("#pass").value};
    }
}

function createAccDropdown(parent) {
  !document.getElementById('create-acc-container') ? render(parent,'create-acc-container') : parent.removeChild(document.getElementById('create-acc-container'))
}

async function awaitMes(mes, data) {
  return chrome.runtime.sendMessage({type: mes, data: data})
}

function render(parent, page) {
  if (page === 'create-acc-container') {
    const createAccContainer = document.createElement('div');
    createAccContainer.id = 'create-acc-container'; // Set an ID to track it
    createAccContainer.innerHTML = `
        <div style="margin-top: 10px; border-top: 1px solid #555; pt: 10px;">
          <label for="user">Username:</label>
          <input type="text" id="user" name="username"><br>
          <label for="pass">Password:</label>
          <input type="password" id="pass" name="password">
          <button id="create-btn">confirm</button>
        </div>`;
    parent.appendChild(createAccContainer);
  }
  else if (page === 'login-container') {
      const loginContainer = document.createElement('div');
      loginContainer.id = 'login-container';
      loginContainer.innerHTML = `
        <div style="margin-top: 10px; border-top: 1px solid #555; pt: 10px;">
          <label for="user">Username:</label>
          <input type="text" id="user" name="username"><br>
          <label for="pass">Password:</label>
          <input type="password" id="pass" name="password">
          <button id="create-acc-btn">Create Account</button>
        </div>`;
      parent.appendChild(loginContainer);
    }

}