import { distance } from "./extension/lib/levanshtein.js"
import { testDict } from "./dictionaries/test.js"
console.log("script loaded")
let lastMouseEvent = null
document.addEventListener("mousemove",(e1) => {
  lastMouseEvent = e1
})

document.addEventListener('keydown',(e2) => {
    if(e2.shiftKey) {
        const word = getWordFromMouse(lastMouseEvent)
        if(word.length > 0) {
            fetchDefinition(word);
            console.log("At fetching word")
        }
        else {
        }
    }
});

function getWordFromMouse(word) {
  let caret;
  if (document.caretPositionFromPoint) {
    caret = document.caretPositionFromPoint(word.clientX,word.clientY)
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

function fetchDefinition(text) {
  // Use a free API like DictionaryAPI.dev
  // const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  // fetch(apiUrl)
  //   .then(response => {
  //     if (response.status === 404) {
  //         fuzzyMatch(word)
  //     }
  //     else {
  //       response.json()
  //     }
  //   })
  //   .then(data => {
  //     // 2. Display the result
  //     const word = data[0].word;
  //     const phonetics = data[0].phonetic;
  //     const definition = data[0].meanings[0].definitions[0].definition;
  const word = testDict[text].word
  let phonetics = testDict[text].phonetics
  let definition = testDict[text].def
  if (word) showTooltip(word, definition, phonetics);
  else console.log("no word")
}

function fuzzyMatch(word) {
  for (e in dictionary) {

  }
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

  document.body.appendChild(tooltip);

  // Add listener for the new AI button
  document.getElementById('ai-btn').addEventListener('click', () => {
     // Call your AI function here
     console.log("Trigger AI explanation...");
  });
}