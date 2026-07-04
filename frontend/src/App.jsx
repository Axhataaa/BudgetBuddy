import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Authentication/Login";
import Register from "./pages/Authentication/Register";
import Dashboard from "./pages/Dashboard/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;