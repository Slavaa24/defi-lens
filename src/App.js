import { useState } from "react";
import Calculator from "./Calculator";
import Pools from "./Pools";
import Portfolio from "./Portfolio";

const tabs = ["Calculator", "Pools", "Portfolio"];

function App() {
  const [activeTab, setActiveTab] = useState("Calculator");

  return (
    <div style={{ background: "#0f0f0f", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif" }}>
      
      {/* Header */}
      <div style={{ borderBottom: "1px solid #222", padding: "20px 40px", display: "flex", alignItems: "center", gap: "40px" }}>
        <h1 style={{ margin: 0, fontSize: "20px" }}>⚡ DeFi Lens</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? "#3b82f6" : "transparent",
              border: activeTab === tab ? "none" : "1px solid #333",
              borderRadius: "8px", padding: "8px 16px", color: "#fff",
              cursor: "pointer", fontSize: "14px"
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
        {activeTab === "Calculator" && <Calculator />}
        {activeTab === "Pools" && <Pools />}
        {activeTab === "Portfolio" && <Portfolio />}
      </div>
    </div>
  );
}

export default App;