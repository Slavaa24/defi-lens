import { useState } from "react";

function App() {
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [priceChangeA, setPriceChangeA] = useState("");
  const [priceChangeB, setPriceChangeB] = useState("");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const pa = parseFloat(priceChangeA) / 100 + 1;
    const pb = parseFloat(priceChangeB) / 100 + 1;
    const il = 2 * Math.sqrt(pa / pb) / (1 + pa / pb) - 1;
    setResult((il * 100).toFixed(2));
  };

  return (
    <div style={{ background: "#0f0f0f", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "60px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>⚡ DeFi Lens</h1>
      <p style={{ color: "#888", marginBottom: "40px" }}>Impermanent Loss Calculator</p>

      <div style={{ background: "#1a1a1a", padding: "32px", borderRadius: "16px", width: "400px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ color: "#888", fontSize: "13px" }}>Token A name</label>
          <input value={tokenA} onChange={e => setTokenA(e.target.value)} placeholder="e.g. ETH" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ color: "#888", fontSize: "13px" }}>Token B name</label>
          <input value={tokenB} onChange={e => setTokenB(e.target.value)} placeholder="e.g. USDC" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ color: "#888", fontSize: "13px" }}>Token A price change (%)</label>
          <input value={priceChangeA} onChange={e => setPriceChangeA(e.target.value)} placeholder="e.g. +50 or -30" type="number" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ color: "#888", fontSize: "13px" }}>Token B price change (%)</label>
          <input value={priceChangeB} onChange={e => setPriceChangeB(e.target.value)} placeholder="e.g. 0 for stablecoin" type="number" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
        </div>

        <button onClick={calculate} style={{ background: "#3b82f6", border: "none", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "15px", cursor: "pointer", marginTop: "8px" }}>
          Calculate
        </button>

        {result && (
          <div style={{ background: "#111", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "4px" }}>Impermanent Loss</p>
            <p style={{ fontSize: "28px", color: result < 0 ? "#ef4444" : "#22c55e", fontWeight: "bold" }}>{result}%</p>
            <p style={{ color: "#666", fontSize: "12px", marginTop: "8px" }}>vs simply holding {tokenA} and {tokenB}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;