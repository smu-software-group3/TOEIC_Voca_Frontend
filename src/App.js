import logo from "./logo.svg";
import "./App.css";
import { Outlet, useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="App">
      <button onClick={handleLogout}>Logout</button>
      <button onClick={() => navigate("/login")}>Login</button>
      <button onClick={() => navigate("/register")}>Register</button>
      <button onClick={() => navigate("/pwc")}>비밀번호 변경</button>
      <button onClick={() => navigate("/word")}>단어장 조회</button>
      <Outlet />
    </div>
  );
}

export default App;
