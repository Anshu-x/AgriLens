import React, { useState, FormEvent, ChangeEvent } from "react";

type Message = {
  role: "user" | "bot";
  text: string;
};

type ChatbotProps = {
  cnnLstmAnalysis?: {
    crop_health: number;
    water_stress: number;
    yield_prediction: number;
  };
  kpis?: {
    modelParams: number;
  };
};

const ChatbotSection: React.FC<ChatbotProps> = ({ cnnLstmAnalysis, kpis }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hi! I'm Agrilens Assistant 🤖 powered by CNN+LSTM fusion models + Gemini AI. Ask me anything about crops, water, or yield!",
    },
  ]);
  const [input, setInput] = useState<string>("");

  const formatBotReply = (text: string) => {
    return text
      .trim()
      .replace(/\n{2,}/g, "\n") // collapse multiple new lines
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold markdown
      .replace(/- /g, "• ") // bullet points
      .replace(/\n/g, "<br />"); // keep line breaks
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      // Inject project + analysis context as first "user" message
      const contextPrompt = `
You are 🤖 Agrilens Assistant, built with Google Gemini AI.
You always know the following context:
- CNN crop health: ${cnnLstmAnalysis?.crop_health ?? "N/A"}%
- LSTM water stress: ${cnnLstmAnalysis?.water_stress ?? "N/A"}%
- Fusion yield prediction: ${cnnLstmAnalysis?.yield_prediction ?? "N/A"}%
- Model parameters: ${kpis?.modelParams?.toLocaleString() ?? "unknown"}

Answer clearly with bullet points, bold key terms, and helpful suggestions.
`;

      const conversation = [
        { role: "user", parts: [{ text: contextPrompt }] },
        ...messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
        { role: "user", parts: [{ text: input }] },
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: conversation }),
        }
      );

      const data = await res.json();
      const aiReplyRaw =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No reply received";

      const formattedReply = formatBotReply(aiReplyRaw);

      setMessages((prev) => [...prev, { role: "bot", text: formattedReply }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Sorry, I couldn't reach Gemini API." },
      ]);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto flex flex-col h-[600px] rounded-2xl shadow-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl text-white">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          🤖 Agrilens Assistant
        </h3>
        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
          {cnnLstmAnalysis && kpis
            ? `${kpis.modelParams.toLocaleString()} params`
            : "Ready"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
        {/* Analysis bubble */}
        {cnnLstmAnalysis && (
          <div className="flex gap-2 items-start">
            <span className="text-xl">🤖</span>
            <div className="bg-green-100 text-green-900 px-4 py-2 rounded-2xl rounded-bl-none shadow">
              🧠 <strong>Analysis Complete!</strong>
              <br />
              • CNN detected {cnnLstmAnalysis.crop_health.toFixed(1)}% spatial health
              <br />
              • LSTM found {cnnLstmAnalysis.water_stress.toFixed(1)}% water stress
              <br />
              • Fusion predicts {cnnLstmAnalysis.yield_prediction.toFixed(1)}% yield
              <br />
              Ask me about crop health, water management, or pest risks!
            </div>
          </div>
        )}

        {/* Chat bubbles */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "bot" && <span className="text-xl mr-2">🤖</span>}
            <div
              className={`px-4 py-2 rounded-2xl max-w-[75%] shadow prose prose-sm ${
                msg.role === "user"
                  ? "bg-green-600 text-white rounded-br-none"
                  : "bg-white text-gray-800 border rounded-bl-none"
              }`}
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
            {msg.role === "user" && <span className="text-xl ml-2">👤</span>}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 border-t bg-white rounded-b-2xl"
      >
        <input
          type="text"
          placeholder="Ask about CNN analysis..."
          aria-label="Message input"
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium shadow"
        >
          Send
        </button>
      </form>
    </section>
  );
};

export default ChatbotSection;
