import logo from "./logo.svg";
import "./App.css";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="App">
      <button onClick={() => navigate("/login")}>Login</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default App;
