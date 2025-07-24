import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';
import Landing from './pages/Landing';
import PublicLanding from './components/PublicLanding';
import Structure from './pages/Structure';
import Products from './pages/Products';
import Competencies from './pages/Competencies';
import Vacations from './pages/Vacations';
import Profile from './pages/Profile';
import EmployeeProfile from './pages/EmployeeProfile';
import ProductDetail from './pages/ProductDetail';
import CompetencyDetail from './pages/CompetencyDetail';
import KioskMode from './pages/KioskMode';
import Admin from './pages/Admin';
import Employees from './pages/admin/Employees';
import Skills from './pages/admin/Skills';
import SkillGroups from './pages/admin/SkillGroups';
import AdminProducts from './pages/admin/AdminProducts';
import Departments from './pages/admin/Departments';
import AdminVacations from './pages/admin/Vacations';
import Roles from './pages/admin/Roles';
import UserRoles from './pages/admin/UserRoles';
import Notifications from './pages/admin/Notifications';
import Templates from './pages/admin/Templates';
import NotificationSettings from './pages/admin/NotificationSettings';
import NotificationService from './pages/admin/NotificationService';
import RatingSystem from './pages/admin/RatingSystem';
import SendToken from './pages/SendToken';
import TopRating from './pages/TopRating';
import Rating from './pages/Rating';
import ConfirmToken from './pages/ConfirmToken';
import ReceiveToken from './pages/ReceiveToken';
import Auth from './pages/Auth';
import RoleProvider from './components/RoleProvider';
import AuthProvider from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AccessDenied from './pages/errors/AccessDenied';
import NotFound from './pages/errors/NotFound';
import ServerError from './pages/errors/ServerError';
import TokenDistributionService from './pages/admin/TokenDistributionService';
import DistributionSettings from './pages/admin/DistributionSettings';
import TelegramMiniApp from './pages/TelegramMiniApp';

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <RoleProvider>
          <BrowserRouter>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/auth" element={
              <ProtectedRoute requireAuth={false}>
                <Auth />
              </ProtectedRoute>
            } />
            
            {/* Публичный лендинг для неавторизованных пользователей */}
            <Route path="/" element={
              <ProtectedRoute requireAuth={false}>
                <PublicLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PublicLanding />} />
            </Route>
            
            {/* Главная страница дашборда */}
            <Route path="/home" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="hello" element={<Landing />} />
              <Route path="team-a" element={<Landing />} />
              <Route path="timeline" element={<Landing />} />
            </Route>
            
            {/* Личный кабинет */}
            <Route path="/account" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="profile" element={<Profile />} />
              <Route path="vacations" element={<Profile />} />
              <Route path="rating" element={<Profile />} />
              <Route path="settings" element={<Profile />} />
            </Route>
            
            {/* Защищенные маршруты без /dashboard */}
            <Route path="/structure" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Structure />} />
              <Route path=":view" element={<Structure />} />
            </Route>
            
            <Route path="/products" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Products />} />
              <Route path=":view" element={<Products />} />
            </Route>
            
            <Route path="/competencies" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Competencies />} />
              <Route path=":view" element={<Competencies />} />
            </Route>
            
            <Route path="/vacations" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Vacations />} />
            </Route>
            
            <Route path="/send-token" element={
              <ProtectedRoute>
                <SendToken />
              </ProtectedRoute>
            } />
            
            <Route path="/top-rating" element={
              <ProtectedRoute>
                <TopRating />
              </ProtectedRoute>
            } />
            
            {/* Административные маршруты */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminRoute>
                  <MainLayout />
                </AdminRoute>
              </ProtectedRoute>
            }>
              <Route index element={<Admin />} />
              <Route path="employees" element={<Employees />} />
              <Route path="skills" element={<Skills />} />
              <Route path="skill-groups" element={<SkillGroups />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="departments" element={<Departments />} />
              <Route path="vacations" element={<AdminVacations />} />
              <Route path="roles" element={<Roles />} />
              <Route path="user-roles" element={<UserRoles />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="templates" element={<Templates />} />
              <Route path="notification-settings" element={<NotificationSettings />} />
              <Route path="notification-service" element={<NotificationService />} />
              <Route path="rating-system" element={<RatingSystem />} />
              <Route path="ratings" element={<RatingSystem />} />
              <Route path="rating-settings" element={<RatingSystem />} />
              <Route path="send-token" element={<SendToken />} />
              <Route path="top-rating" element={<TopRating />} />
              <Route path="token-distribution-service" element={<TokenDistributionService />} />
              <Route path="distribution-settings" element={<DistributionSettings />} />
            </Route>
            
            {/* Отдельные защищенные маршруты */}
            <Route path="/employee/:id" element={
              <ProtectedRoute>
                <EmployeeProfile />
              </ProtectedRoute>
            } />
            <Route path="/product/:id" element={
              <ProtectedRoute>
                <ProductDetail />
              </ProtectedRoute>
            } />
            <Route path="/competency/:id" element={
              <ProtectedRoute>
                <CompetencyDetail />
              </ProtectedRoute>
            } />
            
            {/* Публичный маршрут для киоск-режима */}
            <Route path="kiosk" element={<KioskMode />} />
            
            {/* Маршрут для подтверждения токена */}
            <Route path="/confirm-token/:tokenId" element={<ConfirmToken />} />
            
            {/* Маршрут для приема токена по QR-коду */}
            <Route path="/receive-token/:tokenHash" element={<ReceiveToken />} />
            
            {/* Telegram мини-апп */}
            <Route path="/telegram-miniapp" element={<TelegramMiniApp />} />
            
            {/* Страницы ошибок */}
            <Route path="/error/access-denied" element={<AccessDenied />} />
            <Route path="/error/not-found" element={<NotFound />} />
            <Route path="/error/server-error" element={<ServerError />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </RoleProvider>
        </AuthProvider>
      </SettingsProvider>
    );
  } 