import { useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

export default function Calculator() {
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [investment, setInvestment] = useState("");
  const [priceChangeA, setPriceChangeA] = useState("");
  const [priceChangeB, setPriceChangeB] = useState("");
  const [priceA, setPriceA] = useState(null);
  const [priceB, setPriceB] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [result, setResult] = useState(null);
  const [feeAPY, setFeeAPY] = useState("");

  const fetchPrice = async (symbol, setter, setLoading) => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`);
      const price = res.data[symbol.toLowerCase()]?.usd;
      if (price) setter(price);
    } catch {}
    setLoading(false);
  };

  const calculate = () => {
    const pa = parseFloat(priceChangeA) / 100 + 1;
    const pb = parseFloat(priceChangeB) / 100 + 1;
    const inv = parseFloat(investment) || 0;
    const il = 2 * Math.sqrt(pa / pb) / (1 + pa / pb) - 1;
    const ilPercent = (il * 100).toFixed(2);
    const ilDollars = (inv * Math.abs(il)).toFixed(2);
    const holdValue = (inv * (pa + pb) / 2).toFixed(2);
    const poolValue = (inv * (1 + il) * (pa + pb) / 2).toFixed(2);
    const feeEarnings = feeAPY ? (inv * parseFloat(feeAPY) / 100).toFixed(2) : null;
    const netResult = feeEarnings ? (parseFloat(feeEarnings) - parseFloat(ilDollars)).toFixed(2) : null;

    const chartData = [];
    for (let change = -90; change <= 500; change += 10) {
      const p = change / 100 + 1;
      const ilVal = (2 * Math.sqrt(p) / (1 + p) - 1) * 100;
      chartData.push({ change: `${change}%`, il: parseFloat(ilVal.toFixed(2)) });
    }

    setResult({ ilPercent, ilDollars, holdValue, poolValue, chartData, feeEarnings, netResult });
  };

  const inp = (val, set, ph, type = "text") => (
    <input value={val} onChange={e => set(e.target.value)} placeholder={ph} type={type} style={{
      width: "100%", background: "#111", border: "1px solid #222",
      borderRadius: "10px", padding: "11px 14px", color: "#fff",
      marginTop: "6px", fontSize: "14px", outline: "none",
      transition: "border 0.2s"
    }} />
  );

  const card = (children, extra = {}) => (
    <div style={{ background: "#141414", borderRadius: "12px", padding: "20px", border: "1px solid #1f1f1f", ...extra }}>
      {children}
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: "640px" }}>
      {card(
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <p style={{ color: "#555", fontSize: "12px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Token Pair</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#666", fontSize: "12px" }}>Token A — CoinGecko ID</label>
                {inp(tokenA, setTokenA, "ethereum")}
                <button onClick={() => fetchPrice(tokenA, setPriceA, setLoadingA)} style={{
                  marginTop: "8px", background: priceA ? "#0d2e1a" : "#141414",
                  border: `1px solid ${priceA ? "#22c55e44" : "#222"}`,
                  borderRadius: "8px", padding: "6px 12px",
                  color: priceA ? "#22c55e" : "#555", cursor: "pointer", fontSize: "12px"
                }}>
                  {loadingA ? "..." : priceA ? `$${priceA.toLocaleString()}` : "Fetch price"}
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#666", fontSize: "12px" }}>Token B — CoinGecko ID</label>
                {inp(tokenB, setTokenB, "usd-coin")}
                <button onClick={() => fetchPrice(tokenB, setPriceB, setLoadingB)} style={{
                  marginTop: "8px", background: priceB ? "#0d2e1a" : "#141414",
                  border: `1px solid ${priceB ? "#22c55e44" : "#222"}`,
                  borderRadius: "8px", padding: "6px 12px",
                  color: priceB ? "#22c55e" : "#555", cursor: "pointer", fontSize: "12px"
                }}>
                  {loadingB ? "..." : priceB ? `$${priceB.toLocaleString()}` : "Fetch price"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label style={{ color: "#666", fontSize: "12px" }}>Investment (USD)</label>
            {inp(investment, setInvestment, "1000", "number")}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#666", fontSize: "12px" }}>Token A price change (%)</label>
              {inp(priceChangeA, setPriceChangeA, "+100 or -50", "number")}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#666", fontSize: "12px" }}>Token B price change (%)</label>
              {inp(priceChangeB, setPriceChangeB, "0 for stablecoin", "number")}
            </div>
          </div>

          <div>
            <label style={{ color: "#666", fontSize: "12px" }}>Pool fee APY (%) — optional</label>
            {inp(feeAPY, setFeeAPY, "e.g. 25 — from DefiLlama", "number")}
          </div>

          <button onClick={calculate} style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            border: "none", borderRadius: "10px", padding: "14px",
            color: "#fff", fontSize: "15px", cursor: "pointer", fontWeight: "600",
            letterSpacing: "0.3px"
          }}>
            Calculate
          </button>
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {card(
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Impermanent Loss</p>
                <p style={{ fontSize: "36px", color: "#ef4444", fontWeight: "700" }}>{result.ilPercent}%</p>
                <p style={{ fontSize: "16px", color: "#ef444488", marginTop: "4px" }}>-${result.ilDollars}</p>
              </div>
            )}
            {card(
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#555", fontSize: "12px" }}>If HODLed</span>
                  <span style={{ color: "#22c55e", fontWeight: "600" }}>${result.holdValue}</span>
                </div>
                <div style={{ height: "1px", background: "#1f1f1f" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#555", fontSize: "12px" }}>In the pool</span>
                  <span style={{ color: "#f59e0b", fontWeight: "600" }}>${result.poolValue}</span>
                </div>
              </div>
            )}
          </div>

          {result.feeEarnings && card(
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Fee Earnings vs IL</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666", fontSize: "13px" }}>Fee earnings (1yr)</span>
                <span style={{ color: "#22c55e" }}>+${result.feeEarnings}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666", fontSize: "13px" }}>Impermanent Loss</span>
                <span style={{ color: "#ef4444" }}>-${result.ilDollars}</span>
              </div>
              <div style={{ height: "1px", background: "#1f1f1f" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#fff", fontSize: "13px", fontWeight: "600" }}>Net Result</span>
                <span style={{ color: parseFloat(result.netResult) > 0 ? "#22c55e" : "#ef4444", fontWeight: "700" }}>
                  {parseFloat(result.netResult) > 0 ? "+" : ""}{result.netResult}$
                </span>
              </div>
            </div>
          )}

          {card(
            <>
              <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>IL vs Price Change Chart</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={result.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="change" tick={{ fill: "#444", fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fill: "#444", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid #222", borderRadius: "8px", color: "#fff" }} />
                  <ReferenceLine y={0} stroke="#333" />
                  <Line type="monotone" dataKey="il" stroke="#ef4444" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}
    </div>
  );
}