import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import CalendarPage from './pages/CalendarPage';
import SetupTrame from './pages/SetupTrame';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeContext, ThemeProvider } from './components/ThemeContext';
import Snowfall from 'react-snowfall';
import Confetti from 'react-confetti';




// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // UEs and groups won't become stale
      cacheTime: 1000 * 60 * 60, // Cache for 1 hour
    },
  },
});
function App() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme }) => (
          <div className="App">
            
            {theme === 'noel' && (
              <>
                <div
                  className="absolute w-full h-16 top-0 z-[999] -translate-y-[17%] left-0"
                  style={{
                    backgroundImage: 'url(/assets/noel2.png)',
                    backgroundRepeat: 'repeat-x',
                    backgroundSize: 'auto 100%',
                    backgroundPosition: 'center top',
                  }}
                />
                <Snowfall color="white" style={{ zIndex: 200 }} />
              </>
            )}
            
            {theme === 'mexicain' && (
            <>
              <div
                className="absolute left-0 w-full h-16 top-0 z-[999]"
                style={{
                  backgroundImage: 'url(/assets/mexicain.png)',
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: 'auto 150%',
                  backgroundPosition: 'center top',
                }}
              />
              {/* Sun effect */}
              <div
                className="absolute top-12 left-6 w-16 h-16 z-[999] animate-pulse"
                style={{
                  backgroundImage: 'url(/assets/sun.svg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                numberOfPieces={200}
                recycle={false} // set to false if you want a one-time effect
              />
            </>
          )}

            <div className='w-screen h-screen absolute top-0 left-0'>
              <QueryClientProvider client={queryClient}>
                <Router>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path='/calendar/:id' element={<CalendarPage />} />
                    <Route path="/edit">
                      <Route path="trame/:id" element={<SetupTrame />} />
                    </Route>
                  </Routes>
                </Router>
              </QueryClientProvider>
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}

export default App
