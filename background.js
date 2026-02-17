// c:\Users\alex\Downloads\Programming\Ind Project\QuickDict\background.js

import { distance, closest } from "./node_modules/fastest-levenshtein/mod.js";

let englishDict = [];

// Load the dictionary when the background script starts
fetch(chrome.runtime.getURL('meta/english.txt'))
  .then(r => r.text())
  .then(text => {
    englishDict = text.split(/\r?\n/);
  });

// Listen for messages from Content.js

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === 'fuzzyMatch') {
//     // Find the closest word using the loaded dictionary
//     const match = closest(request.word, englishDict);
//     console.log(`resolved to ${match}`)
//     sendResponse({ closestWord: match });
//   }
// });
chrome.runtime.onMessage.addListener((message, sender, sendresponse) => {
  if (message.type === "levanshtein") {
    sendresponse(levanshtein(message.data))
  }
})
function levanshtein(word) {
  return closest(word,englishDict)
}