import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import './pages.css';



// ❗ Replace with your real API key (or use process.env.REACT_APP_GEMINI_API_KEY)
const genAI = new GoogleGenerativeAI("Use api key here"); 
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const ChatbotSection = ({ cnnLstmAnalysis, kpis }) => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm powered by CNN+LSTM fusion models + Gemini AI. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const result = await model.generateContent(input);
      const aiReply = result.response.text();
      const botMsg = { role: "bot", text: aiReply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Sorry, I couldn't reach Gemini API." },
      ]);
    }
  };

  return (
    <section className="card chatbot" aria-label="CNN+LSTM Assistant">
      <div className="chatbot-head">
        <h3>🧠 CNN+LSTM Assistant</h3>
        <span className="status online">
          {cnnLstmAnalysis ? `${kpis.modelParams.toLocaleString()} params` : "Ready"}
        </span>
      </div>

      <div className="chatbot-messages" role="log" aria-live="polite">
        {/* CNN+LSTM Analysis bubble */}
        <div className="msg bot">
          <span className="avatar" aria-hidden>
            🤖
          </span>
          <div className="bubble">
            {cnnLstmAnalysis ? (
              <>
                🧠 <strong>CNN+LSTM Analysis Complete!</strong>
                <br />
                • CNN detected {cnnLstmAnalysis.crop_health.toFixed(1)}% spatial health
                <br />
                • LSTM found {cnnLstmAnalysis.water_stress.toFixed(1)}% water stress
                patterns
                <br />
                • Fusion predicts {cnnLstmAnalysis.yield_prediction.toFixed(1)}% yield
                <br />
                Ask me about crop health, water management, or pest risks!
              </>
            ) : (
              "Hi! I'm powered by CNN+LSTM fusion models. Draw plots to get AI analysis of your fields!"
            )}
          </div>
        </div>

        {/* Chat history */}
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}`}>
            <span className="avatar" aria-hidden>
              {msg.role === "bot" ? "🤖" : "👤"}
            </span>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
      </div>

      <form className="chatbot-input" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Ask about CNN analysis..."
          aria-label="Message input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn primary" type="submit">
          Send
        </button>
      </form>
    </section>
  );
};

export default ChatbotSection;
