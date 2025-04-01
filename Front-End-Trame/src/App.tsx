import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import CalendarPage from './pages/CalendarPage';
import SetupTrame from './pages/SetupTrame';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeContext, ThemeProvider } from './components/ThemeContext';
import ThemeDecorations from './components/ThemeDecorations';
import SecretVideoPage from './components/SecretVideoPage';

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
              <ThemeDecorations theme={theme} />
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
                    <Route path="/secret-video" element={<SecretVideoPage />} />
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
