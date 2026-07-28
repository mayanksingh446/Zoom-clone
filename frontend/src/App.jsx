import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// 1. Capitalize the component import alias
import LandingPage from './pages/landing'; 
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeet from './pages/VideoMeet';

const App = () => {
  return (
    <div className='App'>
    <Router>
      <AuthProvider>
       <Routes>
          {/* 2. Capitalize 'Route' and use 'LandingPage' */}
          <Route path="/" element={<LandingPage />} />
          <Route path='/auth' element={<Authentication/>}></Route>
          <Route path='/:url' element={<VideoMeet/>}></Route>
       </Routes>
       </AuthProvider>
    </Router>
    </div>
  );
};

export default App;