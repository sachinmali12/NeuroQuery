import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Database } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0b0f19] text-slate-100">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse">
            <Database className="w-8 h-8 text-white animate-spin [animation-duration:3s]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
          </span>
        </div>
        <h2 className="text-md font-bold tracking-widest uppercase bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent mb-1">
          NovaSQL
        </h2>
        <p className="text-xs text-slate-500 font-medium tracking-wide animate-pulse">
          Securing session connection...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : null;
};
export default ProtectedRoute;
