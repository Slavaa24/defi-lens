import { useState } from "react";
import Calculator from "./Calculator";
import Pools from "./Pools";
import Portfolio from "./Portfolio";

const tabs = [
  { id: "Calculator", icon: "⚡" },
  { id: "Pools", icon: "🌊" },
  { id: "Portfolio", icon: "📊" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("Calculator");

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ borderBottom: "1px solid #161616", padding: "0 40px", display: "flex", alignItems: "center", gap: "40px", height: "60px", position: "sticky", top: 0, background: "#0a0a0aee", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>⚡</span>
          <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.3px" }}>DeFi Lens</span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? "#161616" : "transparent",
              border: activeTab === tab.id ? "1px solid #222" : "1px solid transparent",
              borderRadius: "8px", padding: "6px 14px", color: activeTab === tab.id ? "#fff" : "#555",
              cursor: "pointer", fontSize: "13px", fontWeight: activeTab === tab.id ? "500" : "400",
              transition: "all 0.15s"
            }}>
              {tab.icon} {tab.id}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", fontSize: "11px", color: "#333", letterSpacing: "0.5px" }}>
          BETA
        </div>
      </div>

      <div style={{ padding: "40px 20px", display: "flex", justifyContent: "center" }}>
        {activeTab === "Calculator" && <Calculator />}
        {activeTab === "Pools" && <Pools />}
        {activeTab === "Portfolio" && <Portfolio />}
      </div>
    </div>
  );
}