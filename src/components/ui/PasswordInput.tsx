import { forwardRef, useState } from 'react';
import Input, { InputProps } from './Input';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showStrengthMeter?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrengthMeter = false, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };
    
    // Calculate password strength if needed
    const calculateStrength = (password: string): number => {
      if (!password) return 0;
      
      let strength = 0;
      
      // Length check
      if (password.length >= 8) strength += 1;
      if (password.length >= 12) strength += 1;
      
      // Character variety checks
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      
      return Math.min(strength, 5);
    };
    
    const getStrengthColor = (strength: number): string => {
      if (strength <= 1) return 'bg-error-500';
      if (strength <= 2) return 'bg-warning-500';
      if (strength <= 3) return 'bg-warning-400';
      if (strength <= 4) return 'bg-success-400';
      return 'bg-success-500';
    };
    
    const getStrengthLabel = (strength: number): string => {
      if (strength <= 1) return 'Very Weak';
      if (strength <= 2) return 'Weak';
      if (strength <= 3) return 'Fair';
      if (strength <= 4) return 'Good';
      return 'Strong';
    };
    
    const passwordStrength = calculateStrength(value as string || '');
    
    return (
      <div className="space-y-1">
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            {...props}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        {showStrengthMeter && value && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`} 
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-600">{getStrengthLabel(passwordStrength)}</p>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;