import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await updatePassword(data.password);
      
      if (error) {
        showToast(error.message || 'Failed to reset password', 'error');
        return;
      }
      
      showToast('Password has been reset successfully', 'success');
      navigate('/login');
    } catch (error: any) {
      showToast(error.message || 'An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reset password</h1>
        <p className="mt-2 text-gray-600">Create a new password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <PasswordInput
          id="password"
          label="New password"
          placeholder="Enter your new password"
          showStrengthMeter
          error={errors.password?.message}
          disabled={isLoading}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/,
              message: 'Password must include uppercase, lowercase, number and special character',
            },
          })}
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          placeholder="Confirm your new password"
          error={errors.confirmPassword?.message}
          disabled={isLoading}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: value => value === password || 'Passwords do not match',
          })}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          icon={<Save size={18} />}
          isLoading={isLoading}
        >
          Reset password
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;