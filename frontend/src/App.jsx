import Navbar from "./components/Navbar";
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import { AppProvider } from './context/AppContext.jsx'
function App() {

  return (
    <BrowserRouter>
    <AppProvider>
      <Routes>
        <Route path='/login' element={<Login></Login>}></Route>
        <Route path='/register' element={<Register></Register>}></Route>
        <Route path='/dashboard' element={<><Navbar></Navbar><Dashboard/></>}></Route>
      </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App
