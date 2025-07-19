import React from 'react';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/login/LoginPage';
import SignUpPage from './pages/signup/SignupPage';
import Dashboard from './pages/dashboard/Dashboard';
import { Routes, Route } from 'react-router-dom';
import ResetPassword from './pages/resetpassword/ResetPassword';
import NewPasswordPage from './pages/newpassword/NewPasswordPage';
import ConnectPage from './pages/connect/Connect';
import CanvasAuthPage from './pages/connect/CanvasAuthPage';
import CalendarPage from './pages/calendar/CalendarPage';
import ProfilePage from './pages/profile/ProfilePage';
import TasksPage from './pages/tasks/TasksPage';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignUpPage/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/calendar" element={<CalendarPage/>}/>
        <Route path="/connect" element={<ConnectPage/>}/>
        <Route path="/canvas-auth" element={<CanvasAuthPage/>}/>
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password/:id/:token" element={<NewPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </div>
  );
};

export default App;
