import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { Domain } from '../../types/assessment';

const DomainSelection = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Fetch domains on component mount
  useState(() => {
    const fetchDomains = async () => {
      try {
        const { data, error } = await supabase
          .from('domains')
          .select('*')
          .order('name');

        if (error) throw error;
        setDomains(data || []);
      } catch (error: any) {
        showToast(error.message, 'error');
      }
    };

    fetchDomains();
  }, []);

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
      return;
    }

    try {
      setLoading(true);
      
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

      // Navigate to Round 1
      navigate(`/assessment/${assessment.id}/round1`);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Select Your Domain</h1>
        <p className="text-gray-600 mb-8">
          Choose the technology domain you'd like to be assessed in. This will determine the technical
          questions in Round 2 of your assessment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {domains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => handleDomainSelect(domain.id)}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                selectedDomain === domain.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{domain.name}</h3>
              <p className="text-sm text-gray-600">{domain.description}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Assessment Structure:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Round 1: 10 General Aptitude Questions (15 minutes)</li>
              <li>Round 2: 5 Technical MCQs + 2 Coding Problems (45 minutes)</li>
            </ul>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartAssessment}
            isLoading={loading}
            disabled={!selectedDomain}
          >
            Start Assessment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DomainSelection;