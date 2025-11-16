import { useRouter } from 'next/router';

const QuestionnaireForm = () => {
  const router = useRouter();

  const submitQuestionnaire = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3000/api/questionnaire/submit', {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to submit questionnaire');

      const data = await response.json();
      
      // Update localStorage with new data
      localStorage.setItem('healthData', JSON.stringify(data));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default QuestionnaireForm; 