/** @format */

import { useState } from "react";

import "./App.css";

function App() {
  const [doc, setDoc] = useState("");
  const [chunkCount, setChunkCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [ansLoading, setAnsLoading] = useState(false);

  const uploadDoc = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: doc }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error); // the backend's real message
        return;
      }

      setMessage(data.message);
      setChunkCount(data.chunks);
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    setError("");
    setAnsLoading(true);

    try {
      const res = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topK: topK === "" ? undefined : Number(topK),
          question: question,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error); // the backend's real message
        return;
      }

      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setAnsLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Talk with your documents</h1>
        <p className="subtitle">
          Upload text, ask questions, and get answers grounded only in your
          document.
        </p>
      </header>

      <div className="layout">
        {/* LEFT PANEL */}
        <div className="left">
          <div className="card">
            <h2>1. Your document</h2>
            <textarea
              value={doc}
              onChange={(e) => setDoc(e.target.value)}
              placeholder="Paste your text here. Separate paragraphs with a blank line."
            />
            <button onClick={uploadDoc} disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </button>
            {chunkCount > 0 && (
              <p className="success">
                {message} — {chunkCount} chunks ready.
              </p>
            )}
          </div>

          <div className="card">
            <h2>2. Ask a question</h2>
            <div className="ask-row">
              <input
                type="text"
                className="question-input"
                placeholder="e.g. Which planet could float in water?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <input
                type="number"
                className="topk-input"
                placeholder="Sources (3)"
                min="1"
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
              />
            </div>
            <button
              onClick={askQuestion}
              disabled={ansLoading || chunkCount === 0}
            >
              {ansLoading ? "Retrieving..." : "Ask"}
            </button>
            {chunkCount === 0 && (
              <p className="hint">Upload a document first.</p>
            )}
          </div>

          {error && <p className="error">{error}</p>}
        </div>

        {/* RIGHT PANEL */}
        <div className="right">
          <div className="card answer-card">
            <h2>Answer</h2>
            {answer ? (
              <>
                <p className="answer">{answer}</p>
                <h3 className="sources-title">Sources</h3>
                <ul className="sources">
                  {sources.map((source, i) => (
                    <li key={i} className="source">
                      <span className="score">{source.score.toFixed(2)}</span>
                      <span>{source.text}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="empty">
                <p>Your answer will appear here.</p>
                <p className="empty-sub">
                  Answers come only from the document you upload.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
