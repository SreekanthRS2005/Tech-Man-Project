import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, description, className, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            ref={ref}
            className={cn(
              'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500',
              error && 'border-error-500 focus:ring-error-500',
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={props.id}
                className={cn('font-medium text-gray-700', props.disabled && 'text-gray-500')}
              >
                {label}
              </label>
            )}
            {description && <p className="text-gray-500">{description}</p>}
            {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;