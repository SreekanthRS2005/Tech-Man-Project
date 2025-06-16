import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import supabase from '../lib/supabase';
import Button from '../components/ui/Button';
import { Assessment } from '../types/assessment';
import { format } from 'date-fns';
import { GamepadIcon, Trophy, Clock, Target } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select(`
            *,
            domains (
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAssessments(data || []);
      } catch (error: any) {
        showToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Techi Man</h1>
            <p className="text-gray-600 mt-1">
              Take assessments to test your technical skills or play our quiz game
            </p>
          </div>
          <div className="flex space-x-3">
            <Link to="/assessment">
              <Button variant="primary" icon={<Target size={18} />}>
                Start Assessment
              </Button>
            </Link>
            <Link to="/quiz">
              <Button variant="secondary" icon={<GamepadIcon size={18} />}>
                Play Quiz Game
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-primary-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Total Assessments</h2>
                <p className="text-3xl font-bold text-primary-600">{assessments.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary-500" />
            </div>
          </div>
          
          <div className="bg-success-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Completed</h2>
                <p className="text-3xl font-bold text-success-600">
                  {assessments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-success-500" />
            </div>
          </div>
          
          <div className="bg-warning-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">In Progress</h2>
                <p className="text-3xl font-bold text-warning-600">
                  {assessments.filter(a => a.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning-500" />
            </div>
          </div>

          <div className="bg-secondary-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Quiz Games</h2>
                <p className="text-3xl font-bold text-secondary-600">∞</p>
                <p className="text-xs text-secondary-700 mt-1">Unlimited plays</p>
              </div>
              <GamepadIcon className="h-8 w-8 text-secondary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/quiz" className="group">
            <div className="bg-gradient-to-r from-secondary-50 to-accent-50 rounded-lg p-6 border-2 border-transparent group-hover:border-secondary-200 transition-all duration-200">
              <div className="flex items-center">
                <div className="bg-secondary-100 rounded-lg p-3 mr-4">
                  <GamepadIcon className="h-6 w-6 text-secondary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quiz Game</h3>
                  <p className="text-gray-600">Test your knowledge with our fun quiz game</p>
                  <p className="text-sm text-secondary-600 mt-1">2 rounds • 5 questions each • Instant results</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/assessment" className="group">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border-2 border-transparent group-hover:border-primary-200 transition-all duration-200">
              <div className="flex items-center">
                <div className="bg-primary-100 rounded-lg p-3 mr-4">
                  <Target className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Technical Assessment</h3>
                  <p className="text-gray-600">Comprehensive technical skill evaluation</p>
                  <p className="text-sm text-primary-600 mt-1">2 rounds • Domain-specific • Detailed analysis</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Assessments</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't taken any assessments yet</p>
            <Link to="/assessment">
              <Button variant="primary">Take Your First Assessment</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {assessment.domains?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assessment.status === 'completed'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {assessment.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {assessment.total_score !== null
                          ? `${assessment.total_score}%`
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {format(new Date(assessment.started_at), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {assessment.completed_at
                          ? format(new Date(assessment.completed_at), 'MMM d, yyyy')
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {assessment.status === 'completed' ? (
                        <Link
                          to={`/assessment/${assessment.id}/results`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Results
                        </Link>
                      ) : (
                        <Link
                          to={`/assessment/${assessment.id}/round1`}
                          className="text-warning-600 hover:text-warning-900"
                        >
                          Continue
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;