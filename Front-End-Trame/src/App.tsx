import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import CalendarPage from './components/CalendarPage';
import Snowfall from 'react-snowfall'
import SetupPage from './components/SetupPage';
import { ECU } from './types/types';
import SetupContexte from './components/SetupContexte';
function App() {
  const [data, setData] = useState<{ [key: string]: ECU[] }>({})/*will be replaced by a server call later*/

  useEffect(() => {
    console.log(data)
  }, [data])
  return (
    <div className='w-screen h-screen absolute top-0 left-0'>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path='/calendar' element={<CalendarPage data={data} />} />
          <Route path='/setup' element={<SetupPage setData={setData} />} /> {/*will be replaced by a server call later*/}
          <Route path="/edit">
            <Route path="context/:id" element={<SetupContexte />} />
            <Route path="tramme/:id" element={<div>Tramme Edit Page</div>} />
          </Route>
        </Routes>
      </Router>
      <div className="absolute w-full h-16 top-0 z-[999] -translate-y-[17%]" style={{ backgroundImage: 'url(./src/assets/noel2.png)', backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%' }}>
      </div>
      <Snowfall color="white" style={{ zIndex: 200 }} />
    </div>
  )
}

export default App
