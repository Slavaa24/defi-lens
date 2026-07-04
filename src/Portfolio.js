import { useState } from "react";
import axios from "axios";

export default function Portfolio() {
  const [address, setAddress] = useState("");
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPortfolio = async () => {
    if (!address) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`https://yields.llama.fi/lendBorrow`);
      setPositions([]);
      setError("Portfolio tracking coming soon. Enter your address to track positions.");
    } catch {
      setError("Could not fetch portfolio data.");
    }
    setLoading(false);
  };

  return (
    <div style={{ width: "100%", maxWidth: "600px" }}>
      <div style={{ background: "#1a1a1a", padding: "32px", borderRadius: "16px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>Portfolio Tracker</h2>
        <p style={{ color: "#666", fontSize: "13px", margin: "0 0 24px" }}>Enter your wallet address to track DeFi positions and IL in real time</p>

        <div style={{ display: "flex", gap: "10px" }}>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="0x... wallet address"
            style={{ flex: 1, background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }} />
          <button onClick={fetchPortfolio} style={{ background: "#3b82f6", border: "none", borderRadius: "8px", padding: "12px 20px", color: "#fff", cursor: "pointer", fontSize: "14px" }}>
            {loading ? "..." : "Track"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: "20px", background: "#111", borderRadius: "8px", padding: "16px" }}>
            <p style={{ color: "#666", fontSize: "13px", margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ marginTop: "24px", background: "#111", borderRadius: "8px", padding: "16px" }}>
          <p style={{ color: "#888", fontSize: "12px", margin: "0 0 8px" }}>Coming soon:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {["Live LP position tracking", "Real-time IL calculation per position", "Total portfolio value", "Fee earnings vs IL comparison", "Alert when IL exceeds threshold"].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "#3b82f6" }}>→</span>
                <span style={{ color: "#666", fontSize: "13px" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}