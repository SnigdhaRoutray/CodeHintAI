// popup.js - UI logic for CodeHintAI popup

const HINT_URL = 'http://127.0.0.1:3000/generate_hint';
const levelEl = document.getElementById('level');
const attemptEl = document.getElementById('attempt');
const getBtn = document.getElementById('getHint');
const copyBtn = document.getElementById('copyHint');
const hintArea = document.getElementById('hintArea');
const statusNote = document.getElementById('statusNote');

// Load saved draft (if any)
try {
  const savedLevel = localStorage.getItem('codehintai_level');
  const savedAttempt = localStorage.getItem('codehintai_attempt');
  if (savedLevel) levelEl.value = savedLevel;
  if (savedAttempt) attemptEl.value = savedAttempt;
} catch (e) { /* ignore */ }

// Helper: show loader
function showLoading() {
  hintArea.innerHTML = '<div class="loader"></div><div style="text-align:center;margin-top:8px;color:#666;font-size:13px;">Fetching hint…</div>';
  getBtn.disabled = true;
  getBtn.style.opacity = "0.7";
  statusNote.innerText = "Waiting for response...";
}

// Helper: show hint text
function showHint(text) {
  hintArea.textContent = text || "No hint returned.";
  getBtn.disabled = false;
  getBtn.style.opacity = "1";
  statusNote.innerText = "";
}

// Helper: show error
function showError(msg) {
  hintArea.textContent = "Error: " + msg;
  getBtn.disabled = false;
  getBtn.style.opacity = "1";
  statusNote.innerText = "";
}

// Copy button
copyBtn.addEventListener('click', () => {
  const text = hintArea.innerText || hintArea.textContent || "";
  if (!text || text.trim() === "" || text.startsWith("Error:") || text === "No hint yet.") {
    alert("No hint to copy.");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    // small visual feedback
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = "Copy Hint", 1200);
  }).catch(() => alert("Failed to copy."));
});

// Main: get hint
getBtn.addEventListener('click', async () => {
  // Save draft
  try {
    localStorage.setItem('codehintai_level', levelEl.value);
    localStorage.setItem('codehintai_attempt', attemptEl.value);
  } catch (e) { /* ignore */ }

  showLoading();

  // Scrape the active tab for title & description
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showError("No active tab found.");
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const title = document.querySelector('h1')?.innerText || document.title || "";
        const selectors = ['.question-content', '.content__u3I1', '.challenge-description', '.problem-statement', '.description'];
        let description = "";
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.innerText && el.innerText.trim().length > 20) { description = el.innerText; break; }
        }
        if (!description) {
          // fallback to article or main content
          description = document.querySelector('article')?.innerText || document.querySelector('main')?.innerText || "";
        }
        if (description.length > 3000) description = description.slice(0, 3000);
        return { title, description };
      }
    });

    if (!results || !results[0] || !results[0].result) {
      showError("Failed to scrape problem from page.");
      return;
    }

    const { title, description } = results[0].result;

    const payload = {
      title: title || "Unknown Problem",
      text: description || "",
      level: Number(levelEl.value) || 1,
      attempt: attemptEl.value || ""
    };

    // send to local backend
    const resp = await fetch(HINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    if (!resp.ok) {
      const txt = await resp.text();
      showError(`Server error: ${txt || resp.status}`);
      return;
    }

    const data = await resp.json();
    if (!data || typeof data.hint === 'undefined') {
      showError("Unexpected server response.");
      return;
    }

    showHint(data.hint);

  } catch (err) {
    // If fetch failed due to connection, try informing user
    console.error(err);
    if (err && err.message && err.message.includes('Failed to fetch')) {
      showError("Cannot reach backend at http://127.0.0.1:3000. Is server running?");
    } else {
      showError(err.message || String(err));
    }
  }
});
