import React, { useState } from 'react';

export default function ShortAnswer({ questions, onComplete, onBack }) {
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

  const calculateScore = (userAnswer, question) => {
    if (!userAnswer || userAnswer.trim().length === 0) return 0;
    
    const answer = userAnswer.toLowerCase().trim();
    const keyPoints = question.keyPoints || [];
    
    // Count how many key points are mentioned
    let pointsFound = 0;
    keyPoints.forEach(point => {
      if (answer.includes(point.toLowerCase())) {
        pointsFound++;
      }
    });
    
    // Basic scoring: give partial credit based on key points mentioned
    const score = Math.min(100, (pointsFound / keyPoints.length) * 100);
    return Math.round(score);
  };

  const calculateResults = () => {
    let totalScore = 0;
    const questionResults = questions.map(question => {
      const userAnswer = selectedAnswers[question.id] || '';
      const score = calculateScore(userAnswer, question);
      totalScore += score;
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        sampleAnswer: question.sampleAnswer,
        keyPoints: question.keyPoints,
        score,
        explanation: question.explanation || null
      };
    });

    const averageScore = Math.round(totalScore / questions.length);

    return {
      score: averageScore,
      total: 100,
      percentage: averageScore,
      timeElapsed,
      questionResults
    };
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
            <h2 className="text-3xl font-bold text-blue-400 mb-4">Short Answer Results</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{results.percentage}%</div>
                  <div className="text-gray-400">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{questions.length}</div>
                  <div className="text-gray-400">Questions Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{formatTime(results.timeElapsed)}</div>
                  <div className="text-gray-400">Time Taken</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 text-center">
                Note: Short answer questions are scored based on key concepts mentioned. Review the sample answers for complete understanding.
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {results.questionResults.map((result, index) => (
              <div key={result.questionId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.score >= 70 ? 'bg-green-600' : result.score >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {result.score}%
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Question {index + 1}</h4>
                    <p className="text-gray-300 mb-4">{result.question}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold text-blue-400 mb-2">Your Answer:</h5>
                        <div className="p-3 bg-gray-700 rounded-lg">
                          <p className="text-gray-200">{result.userAnswer || '(No answer provided)'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-semibold text-green-400 mb-2">Sample Answer:</h5>
                        <div className="p-3 bg-green-900 rounded-lg border border-green-500">
                          <p className="text-green-100 text-sm">{result.sampleAnswer}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-semibold text-yellow-400 mb-2">Key Points to Include:</h5>
                        <div className="grid gap-2">
                          {result.keyPoints.map((point, pointIndex) => {
                            const mentioned = result.userAnswer?.toLowerCase().includes(point.toLowerCase());
                            return (
                              <div 
                                key={pointIndex}
                                className={`p-2 rounded text-sm flex items-center gap-2 ${
                                  mentioned 
                                    ? 'bg-green-900 border border-green-500 text-green-100' 
                                    : 'bg-gray-700 border border-gray-600 text-gray-300'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full ${
                                  mentioned ? 'bg-green-500' : 'bg-gray-500'
                                }`}>
                                  {mentioned && <span className="text-white text-xs">✓</span>}
                                </div>
                                {point}
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
    <div className="min-h-screen bg-transparent text-white p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Short Answer Quiz</h2>
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
              <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>
              <textarea
                value={selectedAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Write your answer here... Be detailed and include key concepts."
                className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none focus:border-blue-500 focus:outline-none"
              />
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-300">
                  💡 Tip: Write a comprehensive answer covering the main concepts. Your response will be evaluated based on key points mentioned.
                </p>
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