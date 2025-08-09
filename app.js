import React, { useState, useEffect } from 'react';
// Google Generative AI SDK မှ GoogleGenerativeAI object ကို import လုပ်ခြင်း
// Note: Version 0.5.0 ကို သုံးထားပါတယ်။
import GoogleGenerativeAI from "https://cdn.jsdelivr.net/npm/@google/generative-ai@0.5.0/dist/index.js";

function App() {
  // State variables for managing UI and data
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [details, setDetails] = useState('');
  const [length, setLength] = useState('');
  const [generatedContentText, setGeneratedContentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOutputError, setIsOutputError] = useState(false);
  const [outputHidden, setOutputHidden] = useState(true);

  // Global API Key state (will be set from sessionStorage)
  const [globalApiKey, setGlobalApiKey] = useState('');

  // Determine which screen to show based on globalApiKey
  const isApiKeyScreen = !globalApiKey;

  // --- Effects ---
  // Load API Key from sessionStorage on component mount
  useEffect(() => {
    const storedApiKey = sessionStorage.getItem('geminiApiKey');
    if (storedApiKey) {
      setGeminiApiKey(storedApiKey);
      setGlobalApiKey(storedApiKey);
    }
  }, []); // Empty dependency array means this runs only once on mount

  // --- Functions (Event Handlers and Logic) ---

  const displayOutput = (text, isError = false) => {
    setGeneratedContentText(text);
    setIsOutputError(isError);
    setOutputHidden(false); // Show the output container
  };

  const saveApiKey = () => {
    if (geminiApiKey.trim()) {
      setGlobalApiKey(geminiApiKey.trim());
      sessionStorage.setItem('geminiApiKey', geminiApiKey.trim());
    } else {
      displayOutput("ကျေးဇူးပြု၍ သင်၏ Gemini API Key ကို ထည့်သွင်းပါ။", true);
    }
  };

  const goBackToApiKeyScreen = () => {
    sessionStorage.removeItem('geminiApiKey');
    setGlobalApiKey('');
    setGeminiApiKey('');
    setOutputHidden(true); // Hide output
    setGeneratedContentText(''); // Clear output
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const generateContent = async () => {
    if (!topic.trim() && !details.trim()) {
      displayOutput("ကျေးဇူးပြု၍ ခေါင်းစဉ် သို့မဟုတ် အကြောင်းအရာ/အသေးစိတ် ဖြည့်သွင်းပါ။", true);
      return;
    }

    if (!globalApiKey) {
      displayOutput("Gemini API Key မတွေ့ပါ။ ကျေးဇူးပြု၍ API Key ထည့်သွင်းပါ။", true);
      return;
    }

    let promptForGemini = "မြန်မာဘာသာဖြင့် အောက်ပါအချက်အလက်များကို အခြေခံ၍ အကြောင်းအရာတစ်ခု ဖန်တီးပေးပါ။\n\n";
    if (topic.trim()) {
      promptForGemini += `ခေါင်းစဉ်: "${topic.trim()}"\n`;
    }
    if (details.trim()) {
      promptForGemini += `အသေးစိတ်အကြောင်းအရာ/အကြံပြုချက်: "${details.trim()}"\n`;
    }
    if (tone && tone !== '') {
      promptForGemini += `ရေးသားဟန်: "${tone}" ဟန်ဖြင့်\n`;
    }
    if (length && length !== '') {
      promptForGemini += `အရှည်: "${length}" အရေးအသား ဖြစ်ပါစေ။\n`;
    }
    promptForGemini += `ကျေးဇူးပြု၍ အချက်အလက်ပြည့်စုံသော အကြောင်းအရာတစ်ခုကို ရေးသားပေးပါ။`;

    console.log("Gemini သို့ ပေးပို့မည့် Prompt:", promptForGemini);

    setIsLoading(true);
    setOutputHidden(true);
    setGeneratedContentText('');
    setIsOutputError(false);

    try {
      const genAI = new GoogleGenerativeAI(globalApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(promptForGemini);
      const response = await result.response;
      const text = response.text();

      if (text) {
        displayOutput(text);
      } else {
        displayOutput("Gemini မှ အဖြေတစ်ခုမှ ပြန်လည်မရရှိခဲ့ပါ။", true);
      }

    } catch (error) {
      console.error('Content ဖန်တီးရာတွင် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။:', error);
      let errorMessage = "Content ဖန်တီးရာတွင် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။";
      if (error.message.includes('API key not valid')) {
        errorMessage += "\n\nသင်ထည့်သွင်းထားသော API Key သည် မမှန်ကန်ပါ။ ကျေးဇူးပြု၍ ပြန်လည်စစ်ဆေးပါ။";
      } else {
        errorMessage += `\n\nအသေးစိတ်အချက်အလက်: ${error.message}`;
      }
      displayOutput(errorMessage, true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(generatedContentText).then(() => {
      // Direct DOM manipulation for temporary UI feedback
      const copyBtn = document.getElementById('copyOutputBtn');
      if (copyBtn) {
        copyBtn.textContent = 'ကူးယူပြီးပြီ!';
        setTimeout(() => {
          copyBtn.textContent = 'ကူးယူရန်';
        }, 1500);
      }
    }).catch(err => {
      console.error('Copy Failed:', err);
      alert('Content ကူးယူ၍ မရပါ။ (HTTPS သို့မဟုတ် လုံခြုံသော localhost တွင်သာ အလုပ်လုပ်ပါသည်)');
    });
  };

  return (
    <div className="container">
      <div className="header">
        <h1>မြန်မာ Content AI</h1>
        <div>
          <button
            id="refreshBtn"
            onClick={refreshPage}
            className={!isApiKeyScreen ? 'visible' : ''}
            title="Refresh"
          >
            &#x21BB; {/* Unicode for Refresh symbol */}
          </button>
          <button
            id="backBtn"
            onClick={goBackToApiKeyScreen}
            className={!isApiKeyScreen ? 'visible' : ''}
            disabled={isApiKeyScreen}
            title="Go Back"
          >
            &#x2190; {/* Unicode for Left Arrow */}
          </button>
        </div>
      </div>

      {isApiKeyScreen ? (
        // API Key Screen
        <div id="apiKeyScreen">
          <div className="form-group">
            <label htmlFor="geminiApiKey">Gemini API Key</label>
            <input
              type="password"
              id="geminiApiKey"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="သင်၏ Google Gemini API key အား ဤနေရာတွင် ထည့်သွင်းပါ။"
            />
          </div>
          <button className="primary-btn" onClick={saveApiKey}>
            ဆက်လက်ဆောင်ရွက်ရန်
          </button>
          <p>သင်၏ Gemini API key အား Google AI Studio တွင် ရယူနိုင်ပါသည်။</p>
        </div>
      ) : (
        // Prompt Generator Screen
        <div id="promptGeneratorScreen">
          <div className="form-group">
            <label htmlFor="topic">ခေါင်းစဉ်အမည်</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="ဥပမာ: မြန်မာအစားအစာအချက်အပြုတ်များ၊ စာပေအကြောင်း၊ နည်းပညာ"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tone">ရေးသားဟန်</label>
            <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="">ရေးသားဟန်ကို ရွေးချယ်ပါ</option>
              <option value="တရားဝင်">တရားဝင် (Formal)</option>
              <option value="ပေါ့ပေါ့ပါးပါး">ပေါ့ပေါ့ပါးပါး (Casual)</option>
              <option value="အချက်အလက်ပြည့်စုံ">အချက်အလက်ပြည့်စုံ (Informative)</option>
              <option value="တီထွင်ဖန်တီး">တီထွင်ဖန်တီး (Creative)</option>
              <option value="ဟာသနှော">ဟာသနှော (Humorous)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="details">အကြောင်းအရာ / အကြံပြုချက်</label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="သင်၏ မေးခွန်း သို့မဟုတ် လိုချင်သည့် အကြောင်းအရာ၊ အချက်အလက်များကို ဤနေရာတွင် အသေးစိတ်ရေးပါ။ ဥပမာ- 'မြန်မာ့ရိုးရာအစားအစာ မုန့်ဟင်းခါး ချက်ပြုတ်နည်းကို အဆင့်ဆင့်ရေးသားပေးပါ။'"
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="length">အရှည်အရေးအသား</label>
            <select id="length" value={length} onChange={(e) => setLength(e.target.value)}>
              <option value="">အရှည်ကို ရွေးချယ်ပါ</option>
              <option value="တိုတောင်းသည်">တိုတောင်းသည် (Short)</option>
              <option value="အလယ်အလတ်">အလယ်အလတ် (Medium)</option>
              <option value="ရှည်လျားသည်">ရှည်လျားသည် (Long)</option>
            </select>
          </div>

          <button className="primary-btn" onClick={generateContent} disabled={isLoading}>
            Content ဖန်တီးရန်
          </button>

          {isLoading && (
            <div id="loadingIndicator">Content ဖန်တီးနေပါသည်။ ကျေးဇူးပြု၍ ခနစောင့်ပါ။...</div>
          )}

          {!outputHidden && (
            <div id="outputContainer">
              <pre className={isOutputError ? 'error-text' : ''}>{generatedContentText}</pre>
              <button id="copyOutputBtn" onClick={copyOutput} style={{ opacity: isOutputError ? 0 : 1 }}>
                ကူးယူရန်
              </button>
            </div>
          )}
        </div>
      )}

      <div className="footer-links">
        <a href="https://t.me/aiohubpsm" target="_blank" rel="noopener noreferrer">
          Join Telegram Channel 
        </a>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
          Google AI Studio (API Key ရယူရန်)
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          Buy Premium here
        </a>
      </div>
    </div>
  );
}

export default App;

// CSS Styles (You can put this in App.css or index.css)
// For a quick setup, you can also put it directly here within a <style> tag in a real .jsx file,
// but it's better practice to import a separate CSS file.
// For this example, I'm providing it as a comment block.

/*
body {
    font-family: 'Padauk', sans-serif;
    background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    padding: 20px;
    box-sizing: border-box;
}

.container {
    background-color: rgba(0, 0, 0, 0.7);
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 500px;
    box-sizing: border-box;
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.header h1 {
    font-size: 1.8em;
    color: #fdbb2d;
    margin: 0;
    display: flex;
    align-items: center;
}

.header h1::before {
    content: '✨';
    margin-right: 10px;
    font-size: 1.2em;
}

.header button {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5em;
    cursor: pointer;
    transition: transform 0.2s ease;
    display: none;
}
.header button.visible {
    display: block;
}

.header button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.header button:hover:not(:disabled) {
    transform: scale(1.1);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #ccc;
}

.form-group input[type="text"],
.form-group input[type="password"],
.form-group select,
.form-group textarea {
    width: calc(100% - 20px);
    padding: 12px 10px;
    border: 1px solid #555;
    border-radius: 8px;
    background-color: #333;
    color: #fff;
    font-size: 1em;
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

.form-group select {
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2C197.398c-0.3%2C0.3-0.6%2C0.4-1%2C0.4H6.4c-0.4%2C0-0.7-0.1-1-0.4c-0.6-0.6-0.6-1.6%2C0-2.2l140-140c0.3-0.3%2C0.6-0.4%2C1-0.4s0.7%2C0.1%2C1%2C0.4l140%2C140C287.6%2C195.798%2C287.6%2C196.798%2C287%2C197.398z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 10px top 50%;
    background-size: 12px auto;
    padding-right: 30px;
}

.form-group textarea {
    resize: vertical;
    min-height: 100px;
}

button.primary-btn {
    background-color: #fdbb2d;
    color: #333;
    padding: 15px 25px;
    border: none;
    border-radius: 8px;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

button.primary-btn:hover:not(:disabled) {
    background-color: #e0a320;
    transform: translateY(-2px);
}

button.primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.footer-links {
    text-align: center;
    margin-top: 30px;
}

.footer-links a {
    color: #fdbb2d;
    text-decoration: none;
    margin: 0 10px;
    font-size: 0.9em;
    transition: color 0.2s ease;
}

.footer-links a:hover {
    color: #fff;
}

#apiKeyScreen {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex-grow: 1;
    justify-content: center;
}

#apiKeyScreen p {
    margin-top: 20px;
    font-size: 0.9em;
    color: #ccc;
}

#promptGeneratorScreen {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

#outputContainer {
    margin-top: 25px;
    padding: 15px;
    background-color: #2a2a2a;
    border: 1px solid #444;
    border-radius: 8px;
    min-height: 100px;
    color: #eee;
    font-size: 0.95em;
    white-space: pre-wrap;
    word-wrap: break-word;
    position: relative;
}

#outputContainer.hidden {
    display: none;
}

#copyOutputBtn {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.8em;
    position: absolute;
    top: 10px;
    right: 10px;
    opacity: 0;
    transition: opacity 0.3s ease, background-color 0.2s ease;
}

#outputContainer:hover #copyOutputBtn {
    opacity: 1;
}
#copyOutputBtn:hover {
    background-color: #0056b3;
}

#loadingIndicator {
    text-align: center;
    margin-top: 20px;
    color: #fdbb2d;
    font-weight: bold;
}

.error-text {
    color: #ff6b6b;
    font-weight: bold;
}
*/
