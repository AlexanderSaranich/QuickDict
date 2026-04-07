console.log("script loaded");

let lastMouseEvent = null;

document.addEventListener("mousemove", (e1) => {
  lastMouseEvent = e1;
});

document.addEventListener('keydown', (e2) => {
  if (e2.shiftKey) {
    if (!lastMouseEvent) return;
    
    // Try to grab the word
    const word = getWordFromMouse(lastMouseEvent);
    
    if (word && word.length > 0) {
      fetchDefinition(word);
    } else {
      console.log("Could not fetch word at mouse position.");
    }
  }
});

function getWordFromMouse(e) {
  let caret;
  if (document.caretPositionFromPoint) {
    caret = document.caretPositionFromPoint(e.clientX, e.clientY);
  } else if (document.caretRangeFromPoint) {
    let range = document.caretRangeFromPoint(e.clientX, e.clientY);
    caret = { offsetNode: range.startContainer, offset: range.startOffset };
  }

  if (!caret) return null;

  const node = caret.offsetNode;
  const offset = caret.offset;
  if (node.nodeType !== Node.TEXT_NODE) return null;
  
  const text = node.textContent;
  let start = offset;
  let end = offset;
  
  while (start > 0 && /\w/.test(text[start - 1])) start--;
  while (end < text.length && /\w/.test(text[end])) end++;
  
  return text.slice(start, end) || null;
}

function fetchDefinition(word) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  fetch(apiUrl)
    .then(async response => {
      if (response.status === 404) {
        const fuzzyWord = await awaitMes("levanshtein", word);
        const newUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${fuzzyWord}`;
        console.log("levanshtein'd to " + fuzzyWord);
        
        const newResponse = await fetch(newUrl);
        if (newResponse.status === 404) {
          alert("Error: Word does not exist in dictionary");
          return null;
        }
        return newResponse.json();
      }
      return response.json();
    })
    .then(data => {
      if (!data) return;
      const resultWord = data[0].word;
      const phonetics = data[0].phonetic;
      const definition = data[0].meanings[0].definitions[0].definition;
      
      if (resultWord) {
        showTooltip(resultWord, definition, phonetics);
      } else {
        console.log("no word");
      }
    })
    .catch(err => console.error("Error fetching definition:", err));
}

function showTooltip(word, definition = "bruh", phonetics = "") {
  const existing = document.getElementById('my-custom-tooltip');
  if (existing) existing.remove();

  const btnStyle = "background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.2);";

  const tooltip = document.createElement('div');
  tooltip.id = 'my-custom-tooltip';
  tooltip.style.position = 'fixed';
  tooltip.style.top = '20px';
  tooltip.style.right = '20px';
  tooltip.style.backgroundColor = '#1e293b';
  tooltip.style.color = '#f8fafc';
  tooltip.style.padding = '20px';
  tooltip.style.zIndex = '10000';
  tooltip.style.borderRadius = '12px';
  tooltip.style.border = '1px solid #334155';
  tooltip.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
  tooltip.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
  tooltip.style.maxWidth = '300px';
  tooltip.style.display = 'flex';
  tooltip.style.flexDirection = 'column';
  tooltip.style.gap = '8px';

  tooltip.innerHTML = `
    <button id="close-tooltip-btn" style="position: absolute; top: 10px; right: 15px; cursor: pointer; background: transparent; border: none; color: #94a3b8; font-size: 20px; font-weight: bold; padding: 0; line-height: 1;">&times;</button>
    <p style="margin: 0; padding-right: 15px; font-size: 16px;"><strong>${word}</strong></p>
    ${phonetics !== "" ? `<p style="margin: 0; color: #94a3b8; font-size: 13px;"><em>${phonetics}</em></p>` : ''}
    <p id="dict-def" style="margin: 0; font-size: 14px; line-height: 1.4;">${definition}</p>
    <hr style="border: 0; border-top: 1px solid #334155; width: 100%; margin: 5px 0;">
    <div id="ai-response-container"></div>
    <button id="ai-btn" style="${btnStyle}">AI Explain</button>
  `;

  document.body.appendChild(tooltip);

  // --- CLOSE BUTTON LOGIC ---
  document.getElementById('close-tooltip-btn').addEventListener('click', () => {
    tooltip.remove();
  });

  // --- AI BUTTON LOGIC ---
  document.getElementById('ai-btn').addEventListener('click', () => handleAIExplain(word));

  // // --- SIGN IN BUTTON LOGIC ---
  // document.getElementById('sign-btn').addEventListener('click', () => {
  //   if (document.getElementById('create-acc-container')) {
  //     toggleElement(tooltip, 'create-acc-container');
  //   }
  //   toggleElement(tooltip, 'login-container');
  // });
}

async function handleAIExplain(word) {
  const aiContainer = document.getElementById('ai-response-container');
  const aiBtn = document.getElementById('ai-btn');

  // Show loading state
  aiBtn.disabled = true;
  aiBtn.innerText = "Thinking...";
  aiContainer.innerHTML = "<p style='color: #aaa; font-size: 0.9em;'>Fetching AI explanation...</p>";

  const context = getSentenceContext();

  try {
    // Wait for the background script to reply
    const response = await Promise.race([
      awaitMes("getDefinitionFromAI", { word, context }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);
    console.log("Success:", response);

    // Check if the background script reported an error
    if (response.error) {
      if (response.error === "MISSING_KEY" || response.error === "INVALID_KEY") {
        console.log(response.error)
        alert("Please set a valid AI API Key in the QuickDict extension options!");
      } else {
         alert("AI Error: " + (response.details || "Could not fetch explanation."));
      }
      
      // Reset the UI so they can try again later
      aiContainer.innerHTML = ""; 
      aiBtn.innerText = "AI Explain";
      aiBtn.disabled = false;
      return; 
    }

    // If no error, display the text!
    if (response.success) {
      aiContainer.innerHTML = `<p style="color: #00d1b2; font-style: italic;">AI: ${response.text}</p>`;
      aiBtn.innerText = "AI Explained";
    }

  } catch (err) {
    console.error("Promise Error:", err);
    alert("Extension error: Could not connect to the background worker.");
    aiContainer.innerHTML = ""; 
    aiBtn.innerText = "AI Explain";
    aiBtn.disabled = false;
  }
}

function getSentenceContext() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
     const node = selection.anchorNode;
     if (node) {
        const text = node.textContent;
        return text.length > 200 ? text.substring(0, 200) + "..." : text;
     }
  }
  
  // Fallback context: just grab the paragraph the mouse was last in
  if (lastMouseEvent && lastMouseEvent.target) {
      const text = lastMouseEvent.target.innerText || lastMouseEvent.target.textContent;
      if (text) return text.length > 200 ? text.substring(0, 200) + "..." : text;
  }
  return "";
}

function toggleElement(parent, id) {
  const el = document.getElementById(id);
  !el ? render(parent, id) : parent.removeChild(el);
}

// function getEmailAndPassword() {
//   return {
//     email: document.querySelector("#user-create")?.value, 
//     pass: document.querySelector("#pass-create")?.value
//   };
// }

async function awaitMes(mes, data) {
  return chrome.runtime.sendMessage({type: mes, data: data});
}

// function render(parent, page) {
//   const containerStyle = "margin-top: 15px; padding: 15px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; display: flex; flex-direction: column; gap: 10px; font-family: 'Inter', system-ui, -apple-system, sans-serif; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);";
//   const labelStyle = "font-size: 13px; font-weight: 500; color: #94a3b8; margin-bottom: -5px;";
//   const inputStyle = "background-color: #0f172a; border: 1px solid #334155; color: #f8fafc; padding: 10px 12px; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box;";
//   const btnStyle = "background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 5px; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.2);";
  
//   if (page === 'create-acc-container') {
//     const createAccContainer = document.createElement('div');
//     createAccContainer.id = 'create-acc-container';
//     createAccContainer.style.cssText = containerStyle;
//     createAccContainer.innerHTML = `
//         <label for="user-create" style="${labelStyle}">Username</label>
//       <input type="text" id="user-create" name="username" style="${inputStyle}" placeholder="Choose a username">
//       <label for="pass-create" style="${labelStyle}">Password</label>
//       <input type="password" id="pass-create" name="password" style="${inputStyle}" placeholder="••••••••">
//       <button id="create-btn" style="${btnStyle}">Confirm</button>
//       `;
//     parent.appendChild(createAccContainer);
    
//     document.getElementById('create-btn').addEventListener('click', async () => {
//       const credentials = getEmailAndPassword();
//       const response = await awaitMes("createUserWithEmailAndPassword", credentials);
//       if (response && response.error) {
//         alert(response.error);
//       } else if (response && response.success) {
//         alert("Account created successfully!");
//       }
//     });

//   } else if (page === 'login-container') {
//     const loginContainer = document.createElement('div');
//     loginContainer.id = 'login-container';
//     loginContainer.style.cssText = containerStyle;
//     loginContainer.innerHTML = `
//       <label for="user" style="${labelStyle}">Username</label>
//       <input type="text" id="user" name="username" style="${inputStyle}" placeholder="Enter username">
//       <label for="pass" style="${labelStyle}">Password</label>
//       <input type="password" id="pass" name="password" style="${inputStyle}" placeholder="••••••••">
//       <button id="create-acc-btn" style="${btnStyle}">Create Account</button>`;
//     parent.appendChild(loginContainer);

//     document.getElementById('create-acc-btn').addEventListener('click', () => {
//       toggleElement(parent, 'create-acc-container');
//     });
//   }
// }