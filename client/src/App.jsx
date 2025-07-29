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
import CoursesPage from './pages/courses/CoursesPage';
import NotesPage from './pages/notes/NotesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import StudyChatPage from './pages/study-chat/StudyChatPage';
import { NotificationProvider } from './context/NotificationContext';
import NotificationPopup from './components/notifications/NotificationPopup';

const AuthenticatedRoutes = () => {
  return (
    <NotificationProvider>
      <>
        <Routes>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/calendar" element={<CalendarPage/>}/>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/study-chat" element={<StudyChatPage />} />
        </Routes>
        <NotificationPopup />
      </>
    </NotificationProvider>
  );
};

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignUpPage/>}/>
        <Route path="/connect" element={<ConnectPage/>}/>
        <Route path="/canvas-auth" element={<CanvasAuthPage/>}/>
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password/:id/:token" element={<NewPasswordPage />} />

        <Route path="/*" element={<AuthenticatedRoutes />} />
      </Routes>
    </div>
  );
};

export default App;
