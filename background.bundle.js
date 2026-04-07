// node_modules/fastest-levenshtein/esm/mod.js
var peq = new Uint32Array(65536);

// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["api_key"], (r) => {
    if (!r.api_key) {
      chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
    }
  });
});
var englishDict = [];
fetch(chrome.runtime.getURL("meta/english.txt")).then((r) => r.text()).then((text) => {
  englishDict = text.split(/\r?\n/);
});
async function getDefinitionFromAI(word, context) {
  const data = await chrome.storage.local.get("api_key");
  const apiKey = data.api_key;
  console.log("Exact key: " + apiKey);
  if (!apiKey) {
    console.error("Missing API Key!");
    return { error: "MISSING_KEY" };
  }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are a dictionary. Provide a 1-sentence definition." }]
        },
        contents: [{
          parts: [{ text: `Define "${word}" in the context of this sentence: "${context}"` }]
        }],
        generationConfig: {
          temperature: 0.3
        }
      })
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 400 && result.error?.message?.includes("API key not valid")) {
        return { error: "INVALID_KEY" };
      }
      return { error: "API_ERROR", details: result.error?.message || "Unknown Gemini API Error" };
    }
    return { success: true, text: result.candidates?.[0]?.content?.parts?.[0]?.text || "No definition found." };
  } catch (error) {
    console.error("Fetch failed:", error);
    return { error: "NETWORK_ERROR", details: error.message };
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getDefinitionFromAI") {
    handleAI(message, sendResponse);
    console.log("got true");
    return true;
  }
  return false;
});
async function handleAI(message, sendResponse) {
  try {
    const definition = await getDefinitionFromAI(message.data.word, message.data.context);
    sendResponse(definition);
  } catch (error) {
    sendResponse({ error: "INTERNAL_ERROR", details: error.message });
  }
}
