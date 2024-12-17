import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CalendarPage from './components/CalendarPage';
import Snowfall from 'react-snowfall'
import SetupPage from './components/SetupPage';
function App() {

  return (
    <div className='w-screen h-screen absolute top-0 left-0'>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path='/calendar' element={<CalendarPage />} />
          <Route path='/setup' element={<SetupPage />} />
        </Routes>
      </Router>
      <div className="absolute w-full h-16 top-0 z-[999] -translate-y-[17%]" style={{ backgroundImage: 'url(./src/assets/noel2.png)', backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%' }}>
      </div>
      <Snowfall color="white" style={{ zIndex: 200 }} />
    </div>
  )
}

export default App
