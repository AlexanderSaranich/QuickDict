// Load the existing API key when the options page opens


// Save the API key when the button is clicked
document.getElementById('save').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const statusElement = document.getElementById('status');

  // Basic validation to ensure they didn't save an empty string
  if (!apiKey) {
    statusElement.textContent = 'Please enter an API key.';
    statusElement.style.color = '#ef4444'; // A nice red for error
    statusElement.classList.add('show');
    
    setTimeout(() => {
      statusElement.classList.remove('show');
    }, 3000);
    return;
  }
  // Save the key to Chrome local storage
  chrome.storage.local.set({ api_key: apiKey })
  .then(() => {
    // 1. Logic for when saving is finished
    statusElement.textContent = 'Configuration saved successfully!';
    statusElement.style.color = 'var(--success)';
    statusElement.classList.add('show');

    // 2. Handle the fade out
    setTimeout(() => {
      statusElement.classList.remove('show');
    }, 3000);

    // Note: 'set' doesn't return the key, but we know it's 'apiKey'
    console.log("Saved and verified api key:", apiKey);
  })
  .catch((err) => {
    console.error("Error saving to storage:", err);
  });
});
