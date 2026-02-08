
import { Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import Home from './pages/Home';
import Login from './component/Authentication/Login';
import Signup from './component/Authentication/Signup';


const appStyle = {
  minHeight: "100vh",
  backgroundImage: "url('/background.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};
function App() {
  return (
  
  <div style={appStyle}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/chat"
          element={
          
              <Chat />
           
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>

    </div>
  );
}

export default App;
