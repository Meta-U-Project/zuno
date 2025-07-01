import React from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import Dashboard from './pages/dashboard/Dashboard';
import { Routes, Route } from 'react-router-dom';
import ResetPassword from './pages/ResetPassword';
import NewPasswordPage from './pages/NewPasswordPage';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignUpPage/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password/:id/:token" element={<NewPasswordPage />} />
      </Routes>
    </div>
  );
};

export default App;
