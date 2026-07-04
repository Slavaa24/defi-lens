import { useState } from "react";

function App() {
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [investment, setInvestment] = useState("");
  const [priceChangeA, setPriceChangeA] = useState("");
  const [priceChangeB, setPriceChangeB] = useState("");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const pa = parseFloat(priceChangeA) / 100 + 1;
    const pb = parseFloat(priceChangeB) / 100 + 1;
    const il = 2 * Math.sqrt(pa / pb) / (1 + pa / pb) - 1;
    const ilPercent = (il * 100).toFixed(2);
    const ilDollars = (parseFloat(investment) * Math.abs(il)).toFixed(2);
    const holdValue = (parseFloat(investment) * (pa + pb) / 2).toFixed(2);
    const poolValue = (parseFloat(investment) * (1 + il) * (pa + pb) / 2).toFixed(2);
    setResult({ ilPercent, ilDollars, holdValue, poolValue });
  };

  return (
    <div style={{ background: "#0f0f0f", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "60px", paddingBottom: "60px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>⚡ DeFi Lens</h1>
      <p style={{ color: "#888", marginBottom: "40px" }}>Impermanent Loss Calculator</p>

      <div style={{ background: "#1a1a1a", padding: "32px", borderRadius: "16px", width: "420px", display: "flex", flexDirection: "column", gap: "16px" }}>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#888", fontSize: "13px" }}>Token A</label>
            <input value={tokenA} onChange={e => setTokenA(e.target.value)} placeholder="e.g. ETH" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#888", fontSize: "13px" }}>Token B</label>
            <input value={tokenB} onChange={e => setTokenB(e.target.value)} placeholder="e.g. USDC" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
          </div>
        </div>

        <div>
          <label style={{ color: "#888", fontSize: "13px" }}>Investment amount (USD)</label>
          <input value={investment} onChange={e => setInvestment(e.target.value)} placeholder="e.g. 1000" type="number" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#888", fontSize: "13px" }}>Token A change (%)</label>
            <input value={priceChangeA} onChange={e => setPriceChangeA(e.target.value)} placeholder="+50 or -30" type="number" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#888", fontSize: "13px" }}>Token B change (%)</label>
            <input value={priceChangeB} onChange={e => setPriceChangeB(e.target.value)} placeholder="0 for stable" type="number" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
          </div>
        </div>

        <button onClick={calculate} style={{ background: "#3b82f6", border: "none", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "15px", cursor: "pointer", marginTop: "8px" }}>
          Calculate
        </button>

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
            <div style={{ background: "#111", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "4px" }}>Impermanent Loss</p>
              <p style={{ fontSize: "32px", color: "#ef4444", fontWeight: "bold" }}>{result.ilPercent}%</p>
              <p style={{ fontSize: "18px", color: "#ef4444" }}>-${result.ilDollars}</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1, background: "#111", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                <p style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>If you HODLed</p>
                <p style={{ fontSize: "18px", color: "#22c55e", fontWeight: "bold" }}>${result.holdValue}</p>
              </div>
              <div style={{ flex: 1, background: "#111", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                <p style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>In the pool</p>
                <p style={{ fontSize: "18px", color: "#f59e0b", fontWeight: "bold" }}>${result.poolValue}</p>
              </div>
            </div>
            <p style={{ color: "#555", fontSize: "12px", textAlign: "center" }}>vs simply holding {tokenA} and {tokenB}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;