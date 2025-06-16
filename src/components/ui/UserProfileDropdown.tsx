import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, Award, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Successfully signed out', 'success');
    } catch (error) {
      showToast('Failed to sign out', 'error');
    }
    setIsOpen(false);
  };

  const userInitial = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        aria-label="User profile menu"
      >
        <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-sm border-2 border-primary-200 hover:border-primary-300 transition-colors">
          {userInitial}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
            {user?.user_metadata?.full_name || user?.email}
          </div>
          <div className="text-xs text-gray-500">
            {user?.user_metadata?.full_name ? user?.email : 'User'}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Profile Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-lg border-2 border-primary-200">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Award className="h-5 w-5 text-warning-500 mb-1" />
                <span className="text-xs text-gray-600">Tests</span>
                <span className="text-sm font-semibold text-gray-900">0</span>
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="h-5 w-5 text-success-500 mb-1" />
                <span className="text-xs text-gray-600">Avg Score</span>
                <span className="text-sm font-semibold text-gray-900">-</span>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="h-5 w-5 text-primary-500 mb-1" />
                <span className="text-xs text-gray-600">Time</span>
                <span className="text-sm font-semibold text-gray-900">0h</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <User className="h-4 w-4 mr-3" />
              View Profile
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <TrendingUp className="h-4 w-4 mr-3" />
              Test History
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;