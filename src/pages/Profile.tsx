import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import supabase from '../lib/supabase';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PasswordInput from '../components/ui/PasswordInput';
import { User, Mail, Save, Award, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Assessment } from '../types/assessment';
import { format } from 'date-fns';

type ProfileFormValues = {
  fullName: string;
  email: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const Profile = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    totalTime: 0,
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select(`
            *,
            domains (
              name
            )
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setAssessments(data || []);

        // Calculate stats
        const totalTests = data?.length || 0;
        const completedTests = data?.filter(a => a.status === 'completed').length || 0;
        const scores = data?.filter(a => a.total_score !== null).map(a => a.total_score) || [];
        const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

        setStats({
          totalTests,
          completedTests,
          averageScore,
          totalTime: completedTests * 60, // Approximate 60 minutes per test
        });
      } catch (error: any) {
        showToast(error.message, 'error');
      }
    };

    if (user?.id) {
      fetchUserStats();
    }
  }, [user?.id]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setIsProfileLoading(true);
      
      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: data.fullName }
      });

      if (authError) throw authError;

      // Update user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .update({ full_name: data.fullName })
        .eq('id', user?.id);

      if (profileError) throw profileError;
      
      showToast('Profile updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      setIsPasswordLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) throw error;
      
      resetPassword();
      showToast('Password updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update password', 'error');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const userInitial = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and view your progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl mx-auto mb-4 border-4 border-primary-200">
                {userInitial}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.user_metadata?.full_name || 'User'}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                Member since {user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-warning-500 mr-2" />
                  <span className="text-sm text-gray-600">Total Tests</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalTests}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.completedTests}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm text-gray-600">Avg Score</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}%` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-accent-500 mr-2" />
                  <span className="text-sm text-gray-600">Time Spent</span>
                </div>
                <span className="font-semibold text-gray-900">{Math.floor(stats.totalTime / 60)}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              <Input
                id="fullName"
                label="Full name"
                placeholder="Enter your full name"
                icon={<User size={18} />}
                error={profileErrors.fullName?.message}
                disabled={isProfileLoading}
                {...registerProfile('fullName', {
                  required: 'Full name is required',
                })}
              />

              <Input
                id="email"
                label="Email address"
                type="email"
                placeholder="Enter your email"
                icon={<Mail size={18} />}
                disabled={true} // Email can't be changed
                {...registerProfile('email')}
              />

              <Button
                type="submit"
                variant="primary"
                icon={<Save size={18} />}
                isLoading={isProfileLoading}
              >
                Save changes
              </Button>
            </form>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
              <PasswordInput
                id="currentPassword"
                label="Current password"
                placeholder="Enter your current password"
                error={passwordErrors.currentPassword?.message}
                disabled={isPasswordLoading}
                {...registerPassword('currentPassword', {
                  required: 'Current password is required',
                })}
              />

              <PasswordInput
                id="newPassword"
                label="New password"
                placeholder="Enter your new password"
                showStrengthMeter
                error={passwordErrors.newPassword?.message}
                disabled={isPasswordLoading}
                {...registerPassword('newPassword', {
                  required: 'New password is required',
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
                label="Confirm new password"
                placeholder="Confirm your new password"
                error={passwordErrors.confirmPassword?.message}
                disabled={isPasswordLoading}
                {...registerPassword('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: value => value === newPassword || 'Passwords do not match',
                })}
              />

              <Button
                type="submit"
                variant="primary"
                icon={<Save size={18} />}
                isLoading={isPasswordLoading}
              >
                Update password
              </Button>
            </form>
          </div>

          {/* Test History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Test History</h2>
            {assessments.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No assessments taken yet</p>
                <p className="text-sm text-gray-500">Start your first assessment to see your progress here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.slice(0, 5).map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        assessment.status === 'completed' ? 'bg-success-500' : 'bg-warning-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{assessment.domains?.name}</h3>
                        <p className="text-sm text-gray-600">
                          {format(new Date(assessment.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {assessment.total_score !== null ? `${assessment.total_score}%` : 'In Progress'}
                      </p>
                      <p className={`text-sm ${
                        assessment.status === 'completed' ? 'text-success-600' : 'text-warning-600'
                      }`}>
                        {assessment.status === 'completed' ? 'Completed' : 'In Progress'}
                      </p>
                    </div>
                  </div>
                ))}
                {assessments.length > 5 && (
                  <p className="text-center text-sm text-gray-500 pt-4">
                    And {assessments.length - 5} more assessments...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;