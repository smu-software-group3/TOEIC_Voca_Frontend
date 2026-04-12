import logo from './logo.svg';
import './App.css';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  return (
    <div className="App">
      <button onClick={() => navigate('/login')}>Login</button>
    </div>
  );
}

export default App;
