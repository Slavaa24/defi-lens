import { useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Calculator() {
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [investment, setInvestment] = useState("");
  const [priceChangeA, setPriceChangeA] = useState("");
  const [priceChangeB, setPriceChangeB] = useState("");
  const [priceA, setPriceA] = useState(null);
  const [priceB, setPriceB] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [result, setResult] = useState(null);

  const fetchPrice = async (symbol, setter) => {
    if (!symbol) return;
    setLoadingPrice(true);
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
      );
      const price = res.data[symbol.toLowerCase()]?.usd;
      if (price) setter(price);
    } catch {
      setter(null);
    }
    setLoadingPrice(false);
  };

  const calculate = () => {
    const pa = parseFloat(priceChangeA) / 100 + 1;
    const pb = parseFloat(priceChangeB) / 100 + 1;
    const il = 2 * Math.sqrt(pa / pb) / (1 + pa / pb) - 1;
    const ilPercent = (il * 100).toFixed(2);
    const ilDollars = (parseFloat(investment) * Math.abs(il)).toFixed(2);
    const holdValue = (parseFloat(investment) * (pa + pb) / 2).toFixed(2);
    const poolValue = (parseFloat(investment) * (1 + il) * (pa + pb) / 2).toFixed(2);

    const chartData = [];
    for (let change = -90; change <= 300; change += 10) {
      const p = change / 100 + 1;
      const ilVal = (2 * Math.sqrt(p) / (1 + p) - 1) * 100;
      chartData.push({ change: `${change}%`, il: parseFloat(ilVal.toFixed(2)) });
    }

    setResult({ ilPercent, ilDollars, holdValue, poolValue, chartData });
  };

  const input = (val, set, placeholder, type = "text") => (
    <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder} type={type}
      style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "10px", color: "#fff", marginTop: "6px", boxSizing: "border-box" }} />
  );

  return (
    <div style={{ width: "100%", maxWidth: "600px" }}>
      <div style={{ background: "#1a1a1a", padding: "32px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#888", fontSize: "13px" }}>Token A (CoinGecko ID)</label>
            {input(tokenA, setTokenA, "e.g. ethereum")}
            <button onClick={() => fetchPrice(tokenA, setPriceA)} style={{ marginTop: "6px", background: "#222", border: "1px solid #333", borderRadius: "6px", padding: "6px 12px", color: "#888", cursor: "pointer", fontSize: "12px" }}>
              {loadingPrice ? "..." : priceA ? `$${priceA}` : "Fetch price"}
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#888", fontSize: "13px" }}>Token B (CoinGecko ID)</label>
            {input(tokenB, setTokenB, "e.g. usd-coin")}
            <button onClick={() => fetchPrice(tokenB, setPriceB)} style={{ marginTop: "6px", background: "#222", border: "1px solid #333", borderRadius: "6px", padding: "6px 12px", color: "#888", cursor: "pointer", fontSize: "12px" }}>
              {loadingPrice ? "..." : priceB ? `$${priceB}` : "Fetch price"}
            </button>
          </div>
        </div>

        <div>
          <label style={{ color: "#888", fontSize: "13px" }}>Investment amount (USD)</label>
          {input(investment, setInvestment, "e.g. 1000", "number")}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#888", fontSize: "13px" }}>Token A change (%)</label>
            {input(priceChangeA, setPriceChangeA, "+100 or -50", "number")}
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#888", fontSize: "13px" }}>Token B change (%)</label>
            {input(priceChangeB, setPriceChangeB, "0 for stable", "number")}
          </div>
        </div>

        <button onClick={calculate} style={{ background: "#3b82f6", border: "none", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "15px", cursor: "pointer" }}>
          Calculate IL
        </button>

        {result && (
          <>
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
            <div style={{ background: "#111", borderRadius: "8px", padding: "16px" }}>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "12px" }}>IL vs Price Change</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="change" tick={{ fill: "#666", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                  <Line type="monotone" dataKey="il" stroke="#ef4444" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}