import React, { useState } from 'react';

export default function MultipleChoice({ questions, onComplete, onBack }) {
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
  const hasAnswered = selectedAnswers.hasOwnProperty(currentQuestion.id);

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
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

  const calculateResults = () => {
    let correct = 0;
    const questionResults = questions.map(question => {
      const userAnswer = selectedAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correct++;
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        options: question.options
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
            <h2 className="text-3xl font-bold text-white mb-4">Quiz Results</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{results.score}/{results.total}</div>
                  <div className="text-gray-400">Correct Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{results.percentage}%</div>
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
                    <div className="space-y-2">
                      {result.options.map((option, optionIndex) => (
                        <div 
                          key={optionIndex}
                          className={`p-3 rounded-lg border ${
                            optionIndex === result.correctAnswer 
                              ? 'bg-green-900 border-green-500 text-green-100'
                              : optionIndex === result.userAnswer && !result.isCorrect
                              ? 'bg-red-900 border-red-500 text-red-100' 
                              : 'bg-gray-700 border-gray-600'
                          }`}
                        >
                          {option}
                          {optionIndex === result.correctAnswer && (
                            <span className="ml-2 text-green-400">(Correct)</span>
                          )}
                          {optionIndex === result.userAnswer && optionIndex !== result.correctAnswer && (
                            <span className="ml-2 text-red-400">(Your Answer)</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-900 rounded-lg border border-blue-500">
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Multiple Choice Quiz</h2>
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
              className="bg-gray-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">
              {currentQuestionIndex + 1}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-4">{currentQuestion.question}</h3>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedAnswers[currentQuestion.id] === index
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500 hover:bg-gray-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedAnswers[currentQuestion.id] === index
                          ? 'border-white bg-white'
                          : 'border-gray-400'
                      }`}>
                        {selectedAnswers[currentQuestion.id] === index && (
                          <div className="w-2 h-2 bg-gray-600 rounded-full m-0.5" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
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
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 px-6 py-3 rounded-lg transition-colors"
          >
            {isLastQuestion ? 'Submit Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}