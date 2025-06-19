import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/cn';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  children
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconColor: 'text-error-600',
          iconBg: 'bg-error-100',
          confirmVariant: 'danger' as const
        };
      case 'info':
        return {
          icon: CheckCircle,
          iconColor: 'text-primary-600',
          iconBg: 'bg-primary-100',
          confirmVariant: 'primary' as const
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-warning-600',
          iconBg: 'bg-warning-100',
          confirmVariant: 'primary' as const
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all">
          {/* Close button */}
          {!isLoading && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          <div className="p-6">
            {/* Icon and Title */}
            <div className="flex items-center mb-4">
              <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4', config.iconBg)}>
                <Icon className={cn('h-6 w-6', config.iconColor)} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            
            {/* Message */}
            <div className="mb-6">
              <p className="text-gray-600 leading-relaxed">{message}</p>
              {children && (
                <div className="mt-4">
                  {children}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
              <Button
                variant={config.confirmVariant}
                onClick={onConfirm}
                isLoading={isLoading}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;