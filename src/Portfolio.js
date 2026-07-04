import { useState } from "react";
import axios from "axios";

export default function Portfolio() {
  const [address, setAddress] = useState("");
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(null);

  const fetchPortfolio = async () => {
    if (!address || address.length < 10) return;
    setLoading(true);
    setError("");
    setTokens([]);
    setTotal(null);
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,tether,wrapped-bitcoin,aerodrome-finance&vs_currencies=usd`
      );
      const mockTokens = [
        { symbol: "ETH", balance: "1.24", price: res.data["ethereum"]?.usd || 0, value: 1.24 * (res.data["ethereum"]?.usd || 0) },
        { symbol: "USDC", balance: "842.50", price: res.data["usd-coin"]?.usd || 1, value: 842.50 },
        { symbol: "AERO", balance: "1200", price: res.data["aerodrome-finance"]?.usd || 0, value: 1200 * (res.data["aerodrome-finance"]?.usd || 0) },
      ];
      const totalVal = mockTokens.reduce((sum, t) => sum + t.value, 0);
      setTokens(mockTokens);
      setTotal(totalVal.toFixed(2));
    } catch {
      setError("Could not fetch portfolio. Check address and try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ width: "100%", maxWidth: "600px" }}>
      <div style={{ background: "#0f0f0f", borderRadius: "16px", padding: "28px", border: "1px solid #161616" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "6px" }}>Portfolio Tracker</h2>
        <p style={{ color: "#444", fontSize: "12px", marginBottom: "24px" }}>Enter wallet address to see token balances and DeFi positions</p>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="0x... or ENS name"
            style={{ flex: 1, background: "#141414", border: "1px solid #222", borderRadius: "10px", padding: "12px 14px", color: "#fff", fontSize: "13px", outline: "none" }} />
          <button onClick={fetchPortfolio} style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            border: "none", borderRadius: "10px", padding: "12px 20px",
            color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600"
          }}>
            {loading ? "..." : "Track"}
          </button>
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

        {total && (
          <div style={{ marginBottom: "20px", padding: "16px", background: "#141414", borderRadius: "10px", border: "1px solid #1f1f1f" }}>
            <p style={{ color: "#555", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Total Value</p>
            <p style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>${parseFloat(total).toLocaleString()}</p>
          </div>
        )}

        {tokens.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            <p style={{ color: "#444", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Token Balances</p>
            {tokens.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#141414", borderRadius: "10px", border: "1px solid #1a1a1a" }}>
                <div>
                  <p style={{ fontWeight: "600", fontSize: "14px" }}>{t.symbol}</p>
                  <p style={{ color: "#555", fontSize: "12px" }}>{t.balance} tokens</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: "600", fontSize: "14px" }}>${t.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p style={{ color: "#555", fontSize: "12px" }}>${t.price.toLocaleString()}/token</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "16px", background: "#141414", borderRadius: "10px", border: "1px solid #1a1a1a" }}>
          <p style={{ color: "#444", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Coming soon</p>
          {["Live LP positions with real-time IL", "Fee earnings tracker", "IL alerts via Telegram", "Historical performance chart", "Multi-wallet support"].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#3b82f6", fontSize: "12px" }}>→</span>
              <span style={{ color: "#555", fontSize: "12px" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}