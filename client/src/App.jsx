import React from 'react';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/login/LoginPage';
import SignUpPage from './pages/signup/SignUpPage';
import Dashboard from './pages/dashboard/Dashboard';
import { Routes, Route } from 'react-router-dom';
import ResetPassword from './pages/resetpassword/ResetPassword';
import NewPasswordPage from './pages/newpassword/NewPasswordPage';
import ConnectPage from './pages/connect/Connect';
import CanvasAuthPage from './pages/connect/CanvasAuthPage';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignUpPage/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/connect" element={<ConnectPage/>}/>
        <Route path="/canvas-auth" element={<CanvasAuthPage/>}/>
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password/:id/:token" element={<NewPasswordPage />} />
      </Routes>
    </div>
  );
};

export default App;
