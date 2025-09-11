import React, { useState } from 'react';
import MultipleChoice from './quiz/MultipleChoice';
import TrueFalse from './quiz/TrueFalse';
import FillBlanks from './quiz/FillBlanks';
import ShortAnswer from './quiz/ShortAnswer';

export default function QuizMode({ quizData, onClose }) {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  const handleFormatSelect = (formatKey) => {
    setSelectedFormat(formatKey);
    setShowResults(false);
    setQuizResults(null);
  };

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setShowResults(true);
  };

  const handleBackToFormats = () => {
    setSelectedFormat(null);
    setShowResults(false);
    setQuizResults(null);
  };

  const renderQuizComponent = () => {
    if (!selectedFormat) return null;

    const formatData = quizData.formats[selectedFormat];
    
    switch (selectedFormat) {
      case 'multipleChoice':
        return (
          <MultipleChoice 
            questions={formatData.questions}
            onComplete={handleQuizComplete}
            onBack={handleBackToFormats}
          />
        );
      case 'truefalse':
        return (
          <TrueFalse 
            questions={formatData.questions}
            onComplete={handleQuizComplete}
            onBack={handleBackToFormats}
          />
        );
      case 'fillblanks':
        return (
          <FillBlanks 
            questions={formatData.questions}
            onComplete={handleQuizComplete}
            onBack={handleBackToFormats}
          />
        );
      case 'shortanswer':
        return (
          <ShortAnswer 
            questions={formatData.questions}
            onComplete={handleQuizComplete}
            onBack={handleBackToFormats}
          />
        );
      default:
        return null;
    }
  };

  if (selectedFormat) {
    return renderQuizComponent();
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
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Quiz Mode</h1>
            <p className="text-gray-400 mt-2">{quizData.chapterTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Exit Quiz Mode
          </button>
        </div>

        {/* Quiz Format Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(quizData.formats).map(([formatKey, formatData]) => (
            <div
              key={formatKey}
              onClick={() => handleFormatSelect(formatKey)}
              className="bg-gray-800/50 rounded-lg p-6 cursor-pointer hover:bg-gray-700/50 transition-colors border border-gray-600 hover:border-gray-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {formatData.title}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {formatData.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      {formatData.questions.length} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Mixed Difficulty
                    </span>
                  </div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Chapter Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{quizData.totalQuestions}</div>
              <div className="text-sm text-gray-400">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{Object.keys(quizData.formats).length}</div>
              <div className="text-sm text-gray-400">Quiz Formats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">Mixed</div>
              <div className="text-sm text-gray-400">Difficulty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">∞</div>
              <div className="text-sm text-gray-400">Attempts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}