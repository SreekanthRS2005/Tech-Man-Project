import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const Login = () => {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await signIn(data.email, data.password, data.rememberMe);
      
      if (error) {
        showToast(error.message || 'Failed to sign in', 'error');
        return;
      }
      
      showToast('Successfully signed in!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      showToast(error.message || 'An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-2 text-gray-600">Sign in to your account</p>
      </div>

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

        <PasswordInput
          id="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          disabled={isLoading}
          {...register('password', {
            required: 'Password is required',
          })}
        />

        <div className="flex items-center justify-between">
          <Checkbox
            id="rememberMe"
            label="Remember me"
            disabled={isLoading}
            {...register('rememberMe')}
          />
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Forgot your password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          icon={<LogIn size={18} />}
          isLoading={isLoading}
        >
          Sign in
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;