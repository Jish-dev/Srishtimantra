
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import { myContext } from './context/Mycontext'
import Products from './components/Products'
import Detail from './pages/Detail'
import Buy from './pages/Buy'

function App() {
  return (
    <myContext.Provider value={""}>

      <BrowserRouter>
        <Navbar></Navbar>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path='/products' element={<Products />}></Route>
          <Route path="/product/:id" element={<Detail/>} />
          <Route path="/checkout" element={<Buy />} />
        </Routes>
      </BrowserRouter>
    </myContext.Provider>
  )
}

export default App
