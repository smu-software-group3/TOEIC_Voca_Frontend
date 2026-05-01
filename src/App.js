import "./App.css";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    <div
      style={{ minHeight: "100vh", background: "#ffffff", overflow: "hidden" }}
    >
      <Sidebar />
      <div style={{ marginLeft: "260px", minHeight: "100vh", width: "calc(100% - 260px)", boxSizing: "border-box" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
