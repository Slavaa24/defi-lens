import { useState, useEffect } from "react";
import axios from "axios";

export default function Pools() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState("Base");
  const [search, setSearch] = useState("");
  const [minAPY, setMinAPY] = useState("");
  const [sortBy, setSortBy] = useState("tvl");

  const chains = ["Base", "Ethereum", "Arbitrum", "Optimism", "Polygon"];

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get("https://yields.llama.fi/pools");
        const filtered = res.data.data
          .filter(p => p.chain === chain && p.tvlUsd > 10000)
          .sort((a, b) => b.tvlUsd - a.tvlUsd)
          .slice(0, 100);
        setPools(filtered);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [chain]);

  const filtered = pools
    .filter(p => {
      const matchSearch = !search || p.symbol.toLowerCase().includes(search.toLowerCase()) || p.project.toLowerCase().includes(search.toLowerCase());
      const matchAPY = !minAPY || (p.apy || 0) >= parseFloat(minAPY);
      return matchSearch && matchAPY;
    })
    .sort((a, b) => sortBy === "tvl" ? b.tvlUsd - a.tvlUsd : (b.apy || 0) - (a.apy || 0));

  return (
    <div style={{ width: "100%", maxWidth: "960px" }}>

      {/* Chain selector */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
        {chains.map(c => (
          <button key={c} onClick={() => setChain(c)} style={{
            background: chain === c ? "#fff" : "#141414",
            border: `1px solid ${chain === c ? "#fff" : "#222"}`,
            borderRadius: "8px", padding: "7px 14px",
            color: chain === c ? "#000" : "#555",
            cursor: "pointer", fontSize: "13px", fontWeight: chain === c ? "600" : "400"
          }}>{c}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search pool or protocol..." style={{
            flex: 1, background: "#141414", border: "1px solid #222",
            borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none"
          }} />
        <input value={minAPY} onChange={e => setMinAPY(e.target.value)}
          placeholder="Min APY %" type="number" style={{
            width: "120px", background: "#141414", border: "1px solid #222",
            borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none"
          }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
          background: "#141414", border: "1px solid #222", borderRadius: "10px",
          padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none", cursor: "pointer"
        }}>
          <option value="tvl">Sort: TVL</option>
          <option value="apy">Sort: APY</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#444" }}>Loading pools...</div>
      ) : (
        <div style={{ background: "#0f0f0f", borderRadius: "14px", border: "1px solid #161616", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 20px", color: "#444", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #161616" }}>
            <span>Pool</span>
            <span>Protocol</span>
            <span>TVL</span>
            <span>APY</span>
            <span>7d APY</span>
          </div>
          {filtered.slice(0, 30).map((pool, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              padding: "14px 20px", borderBottom: "1px solid #0d0d0d",
              fontSize: "13px", alignItems: "center",
              background: i % 2 === 0 ? "#0f0f0f" : "#0a0a0a",
              transition: "background 0.1s"
            }}>
              <span style={{ color: "#ddd", fontWeight: "500" }}>{pool.symbol}</span>
              <span style={{ color: "#555" }}>{pool.project}</span>
              <span style={{ color: "#888" }}>${pool.tvlUsd > 1e6 ? (pool.tvlUsd / 1e6).toFixed(2) + "M" : (pool.tvlUsd / 1e3).toFixed(0) + "K"}</span>
              <span style={{ color: (pool.apy || 0) > 20 ? "#22c55e" : (pool.apy || 0) > 5 ? "#f59e0b" : "#555", fontWeight: "600" }}>
                {pool.apy?.toFixed(2) || "0.00"}%
              </span>
              <span style={{ color: "#444" }}>{pool.apyMean30d?.toFixed(2) || "-"}%</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ color: "#333", fontSize: "11px", marginTop: "12px", textAlign: "center" }}>
        Data from DefiLlama · {filtered.length} pools found
      </p>
    </div>
  );
}