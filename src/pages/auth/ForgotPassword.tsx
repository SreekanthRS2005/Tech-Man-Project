import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

type ForgotPasswordFormValues = {
  email: string;
};

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await resetPassword(data.email);
      
      if (error) {
        showToast(error.message || 'Failed to send reset email', 'error');
        return;
      }
      
      setIsSubmitted(true);
      showToast('Password reset link sent to your email', 'success');
    } catch (error: any) {
      showToast(error.message || 'An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Forgot password?</h1>
        <p className="mt-2 text-gray-600">
          {isSubmitted
            ? 'Check your email for a reset link'
            : "Enter your email and we'll send you a reset link"}
        </p>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="Enter your email"
            icon={<Mail size={18} />}
            error={errors.email?.message}
            disabled={isLoading}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            icon={<Send size={18} />}
            isLoading={isLoading}
          >
            Send reset link
          </Button>
        </form>
      ) : (
        <div className="text-center bg-success-50 p-6 rounded-lg border border-success-200 animate-slide-up">
          <div className="mb-4 text-success-600">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
          <p className="mt-1 text-sm text-gray-600">
            We've sent a password reset link to your email address.
          </p>
          <Button
            type="button"
            variant="outline"
            size="md"
            className="mt-4"
            onClick={() => setIsSubmitted(false)}
          >
            Try another email
          </Button>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/login"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;