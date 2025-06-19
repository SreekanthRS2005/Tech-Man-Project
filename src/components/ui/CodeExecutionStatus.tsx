import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ExecutionStatus = 'idle' | 'compiling' | 'running' | 'success' | 'error' | 'timeout';

interface CodeExecutionStatusProps {
  status: ExecutionStatus;
  executionTime?: number;
  passedTests?: number;
  totalTests?: number;
  errors?: string[];
  className?: string;
}

const CodeExecutionStatus: React.FC<CodeExecutionStatusProps> = ({
  status,
  executionTime = 0,
  passedTests = 0,
  totalTests = 0,
  errors = [],
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          icon: Clock,
          color: 'gray',
          title: 'Ready to Execute',
          message: 'Click "Run Code" to test your solution'
        };
      case 'compiling':
        return {
          icon: Loader2,
          color: 'blue',
          title: 'Compiling...',
          message: 'Checking syntax and preparing execution',
          animated: true
        };
      case 'running':
        return {
          icon: Loader2,
          color: 'blue',
          title: 'Running Tests...',
          message: `Executing test cases (${executionTime}ms)`,
          animated: true
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'success',
          title: 'Execution Successful',
          message: `${passedTests}/${totalTests} test cases passed in ${executionTime}ms`
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'error',
          title: 'Execution Failed',
          message: errors.length > 0 ? errors[0] : 'Code execution encountered an error'
        };
      case 'timeout':
        return {
          icon: AlertTriangle,
          color: 'warning',
          title: 'Execution Timeout',
          message: 'Code execution exceeded the 5-second time limit'
        };
      default:
        return {
          icon: Clock,
          color: 'gray',
          title: 'Unknown Status',
          message: 'Status not recognized'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    success: 'bg-success-50 border-success-200 text-success-700',
    error: 'bg-error-50 border-error-200 text-error-700',
    warning: 'bg-warning-50 border-warning-200 text-warning-700'
  };

  return (
    <div className={cn(
      'flex items-center p-3 border rounded-lg transition-all duration-200',
      colorClasses[config.color as keyof typeof colorClasses],
      className
    )}>
      <div className="flex-shrink-0 mr-3">
        <Icon 
          className={cn(
            'h-5 w-5',
            config.animated && 'animate-spin'
          )} 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{config.title}</h4>
          {status === 'success' && totalTests > 0 && (
            <div className="flex items-center space-x-2">
              <div className="text-xs font-medium">
                {passedTests}/{totalTests}
              </div>
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-success-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(passedTests / totalTests) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <p className="text-sm opacity-90 mt-1">{config.message}</p>
        
        {/* Show additional errors if any */}
        {status === 'error' && errors.length > 1 && (
          <div className="mt-2 space-y-1">
            {errors.slice(1, 3).map((error, index) => (
              <p key={index} className="text-xs opacity-75">• {error}</p>
            ))}
            {errors.length > 3 && (
              <p className="text-xs opacity-75">... and {errors.length - 3} more errors</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeExecutionStatus;