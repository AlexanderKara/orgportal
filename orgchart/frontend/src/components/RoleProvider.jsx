import React, { createContext, useState, useContext } from 'react';

export const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export default function RoleProvider({ children }) {
  const [activeRole, setActiveRole] = useState(() => {
    const savedRole = localStorage.getItem('activeRole');
    const token = localStorage.getItem('token');
    return savedRole || '';
  });

  // Сохраняем роль в localStorage при изменении
  const handleSetActiveRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  const value = {
    activeRole,
    setActiveRole: handleSetActiveRole
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
} 