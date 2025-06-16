import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const toastTypeClasses: Record<ToastType, string> = {
  success: 'bg-success-50 border-success-400 text-success-800',
  error: 'bg-error-50 border-error-400 text-error-800',
  info: 'bg-primary-50 border-primary-400 text-primary-800',
  warning: 'bg-warning-50 border-warning-400 text-warning-800',
};

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success-500" />,
  error: <AlertCircle className="h-5 w-5 text-error-500" />,
  info: <Info className="h-5 w-5 text-primary-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-500" />,
};

const Toast = ({ message, type = 'info', onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation to complete
  };

  return (
    <div
      className={cn(
        'max-w-md w-full border-l-4 rounded-md shadow-md p-4 flex items-start',
        'transform transition-all duration-300 ease-in-out',
        toastTypeClasses[type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">{toastIcons[type]}</div>
      <div className="flex-1 mr-2">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;