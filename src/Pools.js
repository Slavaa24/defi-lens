import { useState, useEffect } from "react";
import axios from "axios";

export default function Pools() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState("Base");

  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      try {
        const res = await axios.get("https://yields.llama.fi/pools");
        const filtered = res.data.data
          .filter(p => p.chain === chain && p.tvlUsd > 10000)
          .sort((a, b) => b.tvlUsd - a.tvlUsd)
          .slice(0, 20);
        setPools(filtered);
      } catch {
        setPools([]);
      }
      setLoading(false);
    };
    fetchPools();
  }, [chain]);

  const chains = ["Base", "Ethereum", "Arbitrum", "Optimism"];

  return (
    <div style={{ width: "100%", maxWidth: "900px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {chains.map(c => (
          <button key={c} onClick={() => setChain(c)} style={{
            background: chain === c ? "#3b82f6" : "#1a1a1a",
            border: chain === c ? "none" : "1px solid #333",
            borderRadius: "8px", padding: "8px 16px",
            color: "#fff", cursor: "pointer", fontSize: "14px"
          }}>{c}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#888" }}>Loading pools...</p>
      ) : (
        <div style={{ background: "#1a1a1a", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: "1px solid #222", color: "#666", fontSize: "12px" }}>
            <span>Pool</span>
            <span>TVL</span>
            <span>APY</span>
            <span>Protocol</span>
          </div>
          {pools.map((pool, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: "1px solid #111", fontSize: "14px", alignItems: "center" }}>
              <span style={{ color: "#fff" }}>{pool.symbol}</span>
              <span style={{ color: "#888" }}>${(pool.tvlUsd / 1e6).toFixed(2)}M</span>
              <span style={{ color: pool.apy > 10 ? "#22c55e" : "#f59e0b" }}>{pool.apy?.toFixed(2)}%</span>
              <span style={{ color: "#666" }}>{pool.project}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}