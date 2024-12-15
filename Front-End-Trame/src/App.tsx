import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CalendarPage from './components/CalendarPage';

function App() {

  return (
    <div className='w-screen h-screen absolute top-0 left-0'>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path='/calendar' element={<CalendarPage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
