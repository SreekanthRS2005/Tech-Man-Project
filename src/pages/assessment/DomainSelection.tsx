import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Domain } from '../../types/assessment';
import { Target, Clock, Code, CheckCircle } from 'lucide-react';

const DomainSelection = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Fetch domains on component mount
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setDomainsLoading(true);
        const { data, error } = await supabase
          .from('domains')
          .select('*')
          .order('name');

        if (error) throw error;
        
        if (!data || data.length === 0) {
          showToast('No domains available. Please contact administrator.', 'warning');
          return;
        }
        
        setDomains(data);
      } catch (error: any) {
        console.error('Error fetching domains:', error);
        showToast(error.message || 'Failed to load domains', 'error');
      } finally {
        setDomainsLoading(false);
      }
    };

    fetchDomains();
  }, [showToast]);

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId);
  };

  const handleStartAssessment = async () => {
    if (!selectedDomain) {
      showToast('Please select a domain to continue', 'warning');
      return;
    }

    if (!user) {
      showToast('You must be logged in to start an assessment', 'error');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      showToast('Creating your assessment...', 'info');
      
      // Create a new assessment record with user_id
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          domain_id: selectedDomain,
          user_id: user.id,
          status: 'in_progress'
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      showToast('Assessment created successfully!', 'success');
      
      // Navigate to Round 1
      navigate(`/assessment/${assessment.id}/round1`);
    } catch (error: any) {
      console.error('Error creating assessment:', error);
      showToast(error.message || 'Failed to create assessment', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (domainsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading available domains...</p>
          </div>
        </div>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Domains Available</h1>
          <p className="text-gray-600 mb-6">
            No assessment domains are currently available. Please contact the administrator.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const selectedDomainData = domains.find(d => d.id === selectedDomain);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Select Your Assessment Domain</h1>
          <p className="text-gray-600 text-lg">
            Choose the technology domain you'd like to be assessed in. This will determine the technical
            questions in Round 2 of your assessment.
          </p>
        </div>

        {/* Assessment Structure Info */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Assessment Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <Target className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Round 1: Aptitude</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 10 General Aptitude Questions</li>
                <li>• 15 minutes duration</li>
                <li>• 3 marks per question</li>
                <li>• Total: 30 marks</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <Code className="h-6 w-6 text-secondary-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Round 2: Technical</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 5 Technical MCQs (7 marks each)</li>
                <li>• 2 Coding Problems (17.5 marks each)</li>
                <li>• 45 minutes duration</li>
                <li>• Total: 70 marks</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Domain Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Choose Your Domain</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => handleDomainSelect(domain.id)}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-lg ${
                  selectedDomain === domain.id
                    ? 'border-primary-500 bg-primary-50 shadow-lg transform scale-105'
                    : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                  {selectedDomain === domain.id && (
                    <CheckCircle className="h-6 w-6 text-primary-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {domain.description || `Comprehensive assessment covering ${domain.name} concepts and practical skills.`}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Domain Info */}
        {selectedDomainData && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selected Domain: {selectedDomainData.name}
            </h3>
            <p className="text-gray-700 mb-4">
              {selectedDomainData.description || `You will be assessed on ${selectedDomainData.name} concepts, best practices, and problem-solving skills.`}
            </p>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>Total Duration: ~60 minutes</span>
              <span className="mx-2">•</span>
              <Target className="h-4 w-4 mr-1" />
              <span>Total Marks: 100</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={loading}
          >
            Back to Dashboard
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartAssessment}
            isLoading={loading}
            disabled={!selectedDomain || loading}
            icon={<Target size={18} />}
          >
            Start Assessment
          </Button>
        </div>

        {/* Important Notes */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Important Notes:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Once started, the assessment must be completed in one session</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Each round has a strict time limit that cannot be paused</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Make sure you have a stable internet connection</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Your progress will be automatically saved</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DomainSelection;