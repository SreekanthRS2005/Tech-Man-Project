import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';

type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Register = () => {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await signUp(data.email, data.password, data.fullName);
      
      if (error) {
        showToast(error.message || 'Failed to create account', 'error');
        return;
      }
      
      showToast('Account created successfully! Please check your email to verify your account.', 'success');
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
        <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
        <p className="mt-2 text-gray-600">Join Techi Man to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          id="fullName"
          label="Full name"
          placeholder="Enter your full name"
          icon={<User size={18} />}
          error={errors.fullName?.message}
          disabled={isLoading}
          {...register('fullName', {
            required: 'Full name is required',
            minLength: {
              value: 2,
              message: 'Full name must be at least 2 characters',
            },
          })}
        />

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

        <PasswordInput
          id="password"
          label="Password"
          placeholder="Create a password"
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
          placeholder="Confirm your password"
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
          icon={<UserPlus size={18} />}
          isLoading={isLoading}
        >
          Create account
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;