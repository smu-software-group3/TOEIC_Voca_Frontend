import "./App.css";
import { Outlet, useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  // 로그아웃 시 토큰을 지우고 로그인 화면으로 이동한다.
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
      <button onClick={() => navigate("/profile")}>프로필</button>
      <button onClick={() => {
        const token = "your-temporary-token";
        localStorage.setItem("token", token);
      }}>
        임시 토큰 발행
      </button>
      <Outlet />
    </div>
  );
}

export default App;
