import React, { useState } from 'react';

export default function FillBlanks({ questions, onComplete, onBack }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswered = selectedAnswers[currentQuestion.id]?.trim().length > 0;

  const handleAnswerChange = (value) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const results = calculateResults();
    setShowResults(true);
    onComplete(results);
  };

  const checkAnswer = (userAnswer, correctAnswer) => {
    if (!userAnswer) return false;
    
    // Normalize both answers for comparison
    const normalizeAnswer = (str) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);
    
    // Allow for multiple correct formats (e.g., "6.022 × 10²³" or "6.022 x 10^23")
    return normalizedUser === normalizedCorrect || 
           normalizedUser.includes(normalizedCorrect) ||
           normalizedCorrect.includes(normalizedUser);
  };

  const calculateResults = () => {
    let correct = 0;
    const questionResults = questions.map(question => {
      const userAnswer = selectedAnswers[question.id] || '';
      const isCorrect = checkAnswer(userAnswer, question.answer);
      if (isCorrect) correct++;
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.answer,
        isCorrect,
        explanation: question.explanation
      };
    });

    return {
      score: correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
      timeElapsed,
      questionResults
    };
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestionWithBlank = (questionText) => {
    const parts = questionText.split('______');
    if (parts.length === 1) {
      // No blank found, add input at the end
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span>{questionText}</span>
          <input
            type="text"
            value={selectedAnswers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white min-w-[200px] focus:border-blue-500 focus:outline-none"
            placeholder="Enter your answer..."
          />
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <input
                type="text"
                value={selectedAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white min-w-[200px] focus:border-blue-500 focus:outline-none"
                placeholder="Enter your answer..."
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (showResults) {
    const results = calculateResults();
    return (
      <div 
        className="min-h-screen bg-transparent text-white p-6 overflow-y-auto"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          height: '100vh',
          zIndex: 1000
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-blue-400 mb-4">Fill in the Blanks Results</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{results.score}/{results.total}</div>
                  <div className="text-gray-400">Correct Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{results.percentage}%</div>
                  <div className="text-gray-400">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{formatTime(results.timeElapsed)}</div>
                  <div className="text-gray-400">Time Taken</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {results.questionResults.map((result, index) => (
              <div key={result.questionId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.isCorrect ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {result.isCorrect ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Question {index + 1}</h4>
                    <p className="text-gray-300 mb-4">{result.question}</p>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Your Answer:</span>
                        <span className={`px-3 py-1 rounded ${
                          result.isCorrect ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'
                        }`}>
                          {result.userAnswer || '(No answer)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Correct Answer:</span>
                        <span className="px-3 py-1 rounded bg-green-900 text-green-100">
                          {result.correctAnswer}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-900 rounded-lg border border-blue-500">
                      <p className="text-blue-100 text-sm">{result.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={onBack}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors"
            >
              Back to Quiz Formats
            </button>
            <button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setShowResults(false);
                setTimeElapsed(0);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Fill in the Blanks</h2>
            <p className="text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-yellow-400 font-mono">{formatTime(timeElapsed)}</div>
            <button
              onClick={onBack}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">
              {currentQuestionIndex + 1}
            </div>
            <div className="flex-1">
              <div className="text-lg leading-relaxed">
                {renderQuestionWithBlank(currentQuestion.question)}
              </div>
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-300">💡 Tip: Type your answer in the input field above. Be precise with spelling and formatting.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 px-6 py-3 rounded-lg transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!hasAnswered}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 px-6 py-3 rounded-lg transition-colors"
          >
            {isLastQuestion ? 'Submit Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}