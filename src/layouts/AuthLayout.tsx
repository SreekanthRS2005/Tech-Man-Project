import { Outlet } from 'react-router-dom';
import { MonitorSmartphone } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Centered auth form */}
      <div className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <MonitorSmartphone size={48} className="text-primary-600 animate-pulse-slow" />
          <h1 className="mt-4 text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Techi Man
          </h1>
          <p className="mt-2 text-sm text-gray-600">Your Tech Solutions Partner</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;