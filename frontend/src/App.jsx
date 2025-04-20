import Navbar from "./components/Navbar";
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
function App() {

  return (
    <BrowserRouter>
    <Navbar></Navbar>
      <Routes>
        <Route path='/login' element={<Login></Login>}></Route>
        <Route path='/register' element={<Register></Register>}></Route>
        <Route path='/dashboard' element={<Dashboard/>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
