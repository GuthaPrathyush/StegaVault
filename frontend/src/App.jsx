import Navbar from "./components/Navbar";
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import Marketplace from "./Pages/Marketplace.jsx";
import NftDetail from "./Pages/NftDetail.jsx";
import { AppProvider } from './context/AppContext.jsx'
import Upload
 from "./Pages/Upload.jsx";
function App() {

  return (
    <BrowserRouter>
    <AppProvider>
      <Routes>
        <Route path='/' element={<Navigate to="/login" replace />}></Route>
        <Route path='/login' element={<Login></Login>}></Route>
        <Route path='/register' element={<Register></Register>}></Route>
        <Route path='/dashboard' element={<><Navbar></Navbar><Dashboard/></>}></Route>
        <Route path='/marketplace' element={<><Navbar></Navbar><Marketplace></Marketplace></>}/>
        <Route path="/nft/:nft_id" element={<><Navbar /><NftDetail /></>} />
        <Route path='/upload' element={<><Navbar></Navbar><Upload></Upload></>}></Route>
      </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App
