import React, { useState, useEffect, useRef } from "react";
import ThreeBackground from "./ThreeBackground";

const courseData = [
  {
    id: 1,
    title: "Introduction to Chemistry",
    description: "Understanding the basics of chemical science",
    subsections: [
      {
        id: 1,
        title: "What is Chemistry?",
        description: "Exploring the definition and scope of chemistry",
        conversations: [
          { 
            speaker: "Teacher", 
            text: "Welcome to Chemistry! Do you know why we study it?",
            sidebarContent: {
              type: "image",
              src: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400&h=300&fit=crop",
              alt: "Chemistry laboratory with beakers and equipment"
            }
          },
          { 
            speaker: "Learner", 
            text: "Hmm… maybe to understand what things are made of?",
            sidebarContent: null
          },
          { 
            speaker: "Teacher", 
            text: "Exactly. Chemistry is the study of matter — anything that has mass and occupies space.",
            sidebarContent: {
              type: "video",
              src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              title: "What is Matter?"
            }
          }
        ]
      },
      {
        id: 2,
        title: "Applications of Chemistry",
        description: "How chemistry affects our daily lives",
        conversations: [
          { 
            speaker: "Learner", 
            text: "So literally everything around me is chemistry?",
            sidebarContent: null
          },
          { 
            speaker: "Teacher", 
            text: "Yes, from the air you breathe to the food you eat — it's all chemistry.",
            sidebarContent: {
              type: "quiz",
              question: "Which of these is NOT an example of matter?",
              options: ["Water", "Air", "Light", "Wood"],
              correctAnswer: 2,
              explanation: "Light is energy, not matter. Matter has mass and occupies space."
            }
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Atomic Structure",
    description: "Understanding atoms and their components",
    subsections: [
      {
        id: 1,
        title: "What are Atoms?",
        description: "Basic building blocks of matter",
        conversations: [
          { 
            speaker: "Teacher", 
            text: "Now let's explore atoms. What do you think atoms are?",
            sidebarContent: {
              type: "image",
              src: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
              alt: "Atomic structure diagram"
            }
          },
          { 
            speaker: "Learner", 
            text: "Are they the smallest particles that make up everything?",
            sidebarContent: null
          }
        ]
      },
      {
        id: 2,
        title: "Subatomic Particles",
        description: "Protons, neutrons, and electrons",
        conversations: [
          { 
            speaker: "Teacher", 
            text: "Atoms are made of even smaller particles. Can you name any?",
            sidebarContent: {
              type: "quiz",
              question: "Which subatomic particle has a positive charge?",
              options: ["Electron", "Neutron", "Proton", "Photon"],
              correctAnswer: 2,
              explanation: "Protons have a positive charge and are found in the nucleus."
            }
          }
        ]
      }
    ]
  }
];

// Flatten the data for navigation
const getAllConversations = () => {
  const conversations = [];
  let globalIndex = 0;
  
  courseData.forEach(section => {
    section.subsections.forEach(subsection => {
      subsection.conversations.forEach(conversation => {
        conversations.push({
          ...conversation,
          globalIndex,
          sectionId: section.id,
          sectionTitle: section.title,
          subsectionId: subsection.id,
          subsectionTitle: subsection.title
        });
        globalIndex++;
      });
    });
  });
  
  return conversations;
};

const dialogue = getAllConversations();

export default function ConversationPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set([1])); // First section expanded by default

  useEffect(() => {
    setSelectedQuizAnswer(null);
    setShowQuizResult(false);
    setShowMobileSidebar(false);
    setShowContentModal(false);
  }, [currentIndex]);

  // Mouse scroll and touch navigation
  useEffect(() => {
    let scrollTimeout;
    let isScrollingInternal = false;
    let touchStartY = 0;
    let touchStartX = 0;
    
    const handleWheel = (e) => {
      const target = e.target;
      const isInSidebar = target.closest('[data-sidebar]');
      if (isInSidebar) return;
      
      e.preventDefault();
      
      if (isScrollingInternal) return;
      
      isScrollingInternal = true;
      console.log('Scroll detected, current index:', currentIndex, 'direction:', e.deltaY > 0 ? 'down' : 'up');
      
      if (e.deltaY > 0) {
        // Scroll down - next message
        setCurrentIndex(prev => {
          const next = prev < dialogue.length - 1 ? prev + 1 : prev;
          console.log('Moving from', prev, 'to', next);
          return next;
        });
      } else if (e.deltaY < 0) {
        // Scroll up - previous message
        setCurrentIndex(prev => {
          const next = prev > 0 ? prev - 1 : prev;
          console.log('Moving from', prev, 'to', next);
          return next;
        });
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrollingInternal = false;
        console.log('Scroll cooldown finished');
      }, 600);
    };

    const handleTouchStart = (e) => {
      const target = e.target;
      const isInSidebar = target.closest('[data-sidebar]');
      if (isInSidebar) return;
      
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      const target = e.target;
      const isInSidebar = target.closest('[data-sidebar]');
      if (isInSidebar) return;
      
      if (isScrollingInternal) return;
      
      const touchEndY = e.touches[0].clientY;
      const touchEndX = e.touches[0].clientX;
      const deltaY = touchStartY - touchEndY;
      const deltaX = Math.abs(touchStartX - touchEndX);
      
      // Only handle vertical swipes (ignore horizontal swipes)
      if (Math.abs(deltaY) < 50 || deltaX > Math.abs(deltaY)) return;
      
      e.preventDefault();
      isScrollingInternal = true;
      
      if (deltaY > 0) {
        // Swipe up - next message
        setCurrentIndex(prev => {
          const next = prev < dialogue.length - 1 ? prev + 1 : prev;
          console.log('Touch: Moving from', prev, 'to', next);
          return next;
        });
      } else {
        // Swipe down - previous message
        setCurrentIndex(prev => {
          const next = prev > 0 ? prev - 1 : prev;
          console.log('Touch: Moving from', prev, 'to', next);
          return next;
        });
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrollingInternal = false;
        console.log('Touch scroll cooldown finished');
      }, 600);
    };

    console.log('Setting up scroll and touch listeners, current index:', currentIndex);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      console.log('Cleaning up scroll and touch listeners');
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex]);

  const goNext = () => {
    if (currentIndex < dialogue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
  };

  const handleQuizAnswer = (answerIndex) => {
    setSelectedQuizAnswer(answerIndex);
    setShowQuizResult(true);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const navigateToConversation = (sectionId, subsectionId, conversationIndex = 0) => {
    let globalIndex = 0;
    let found = false;
    
    for (const section of courseData) {
      if (found) break;
      for (const subsection of section.subsections) {
        if (section.id === sectionId && subsection.id === subsectionId) {
          globalIndex += conversationIndex;
          found = true;
          break;
        }
        globalIndex += subsection.conversations.length;
      }
    }
    
    if (found) {
      setCurrentIndex(globalIndex);
      setShowLeftSidebar(false);
    }
  };

  const currentMessage = dialogue[currentIndex];

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 text-center py-12 px-6">
        <div className="space-y-2">
          <p className="text-2xl">Some basic concepts of chemistry</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>{currentMessage.sectionTitle}</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6v12z"/>
            </svg>
            <span>{currentMessage.subsectionTitle}</span>
          </div>
        </div>
      </div>

      {/* Left Sidebar Toggle Button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          title="Toggle conversation sections"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
      </div>

      {/* Left Sidebar - Sections Overview */}
      <div 
        data-sidebar
        className={`fixed top-0 left-0 h-full w-80 bg-gray-950 border-r border-gray-800 z-40 transform transition-transform duration-300 ${
          showLeftSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium pl-12 text-white">Course Content</h2>
            <button
              onClick={() => setShowLeftSidebar(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="space-y-1">
              {courseData.map((section, sectionIndex) => (
                <div key={section.id}>
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2 w-full p-2 text-left hover:bg-gray-800 rounded transition-colors duration-150"
                    >
                      <div className="flex items-center justify-center w-4 h-4">
                        <svg 
                          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                            expandedSections.has(section.id) ? 'rotate-90' : ''
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 18l6-6-6-6v12z"/>
                        </svg>
                      </div>
                      
                      <div className="w-5 h-5 rounded bg-pink-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">{section.title}</h3>
                        <p className="text-xs text-gray-400 truncate">{section.description}</p>
                      </div>
                      
                      {dialogue[currentIndex]?.sectionId === section.id && (
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  </div>

                  {expandedSections.has(section.id) && (
                    <div className="ml-4 border-l border-gray-700 space-y-1">
                      {section.subsections.map((subsection, subsectionIndex) => {
                        const isCurrentSubsection = dialogue[currentIndex]?.sectionId === section.id && 
                                                     dialogue[currentIndex]?.subsectionId === subsection.id;
                        const isLastSubsection = subsectionIndex === section.subsections.length - 1;
                        const hasContent = subsection.conversations.some(conv => conv.sidebarContent);
                        
                        return (
                          <div key={subsection.id} className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center">
                              <div className={`border-l border-gray-700 h-full ${isLastSubsection ? 'h-4' : ''}`}></div>
                              <div className="border-t border-gray-700 w-4"></div>
                            </div>
                            
                            <button
                              onClick={() => navigateToConversation(section.id, subsection.id)}
                              className={`w-full flex items-center gap-2 p-2 ml-4 text-left rounded transition-all duration-150 ${
                                isCurrentSubsection
                                  ? 'bg-pink-900/50 text-pink-100'
                                  : 'hover:bg-gray-800 text-gray-300'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                isCurrentSubsection ? 'bg-pink-500' : 'bg-gray-600'
                              }`}>
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-gray-500">{section.id}.{subsection.id}</span>
                                  <h4 className="text-sm font-medium truncate">{subsection.title}</h4>
                                  {hasContent && (
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{subsection.description}</p>
                              </div>
                              
                              {isCurrentSubsection && (
                                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => window.open("https://example.com/chemistry-chapter1.pdf", '_blank')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-200 hover:text-white rounded-lg transition-all duration-300 group"
            >
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V9.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2V9.5c0-.83.67-1.5 1.5-1.5h.5c.83 0 1.5.67 1.5 1.5v3zM9 9v1h1V9H9zm4.5 0v3H15V9h-1.5z"/>
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
              </svg>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">Source Material</div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300">Chemistry Chapter 1.pdf</div>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col min-h-0 pb-20">
        <div className="flex flex-col min-h-0 w-full">
          <div className="flex-1 flex items-center justify-center py-8 overflow-hidden relative">
            {/* <ThreeBackground 
              messageType={currentMessage.speaker === "Teacher" ? "teacher" : "student"}
              contentType={currentMessage.sidebarContent?.type || null}
            /> */}
            
            <div className="w-full max-w-4xl mx-auto relative z-10 space-y-8 transition-all duration-500 ease-out">
              {/* Display previous message (faded) */}
              {currentIndex > 0 && (
                <div className="transition-all duration-500 ease-out opacity-40 scale-95 transform">
                  {dialogue[currentIndex - 1].speaker === "Teacher" ? (
                    <div className="text-center space-y-6 transition-all duration-500 ease-out">
                      <div className="flex items-center justify-center gap-3 transition-all duration-500 ease-out">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg transition-all duration-500 ease-out">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-purple-400/70 uppercase tracking-widest">
                          Instructor
                        </span>
                      </div>
                      <div className="relative">
                        <div className="relative bg-black/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                          <p className="text-lg font-light leading-relaxed text-white/70 tracking-wide">
                            {dialogue[currentIndex - 1].text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="max-w-2xl w-full">
                        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm border-l-4 border-emerald-400/50 rounded-r-2xl p-4 shadow-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                              </svg>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-emerald-300/70 uppercase tracking-wider">
                                Student Response
                              </span>
                            </div>
                          </div>
                          <blockquote className="relative">
                            <p className="text-lg text-gray-100/70 leading-relaxed font-medium italic pl-4">
                              {dialogue[currentIndex - 1].text}
                            </p>
                          </blockquote>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Display current message (full opacity) */}
              <div className="transition-all duration-500 ease-out">
                {currentMessage.speaker === "Teacher" ? (
                  <div className="text-center space-y-8 transition-all duration-500 ease-out">
                    <div className="flex items-center justify-center gap-3 transition-all duration-500 ease-out">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg transition-all duration-500 ease-out">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-purple-400 uppercase tracking-widest">
                        Instructor
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl"></div>
                      <div className="relative bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8">
                        <p className="text-xl font-light leading-relaxed text-white tracking-wide">
                          {currentMessage.text}
                        </p>
                      </div>
                    </div>
                    
                    {currentMessage.sidebarContent && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setShowContentModal(true)}
                          className="group flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300"
                        >
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            {currentMessage.sidebarContent.type === 'image' && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                              </svg>
                            )}
                            {currentMessage.sidebarContent.type === 'video' && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                              </svg>
                            )}
                            {currentMessage.sidebarContent.type === 'quiz' && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-white/90 font-medium">
                            {currentMessage.sidebarContent.type === 'image' && 'View Image'}
                            {currentMessage.sidebarContent.type === 'video' && 'Watch Video'}
                            {currentMessage.sidebarContent.type === 'quiz' && 'Take Quiz'}
                          </span>
                          <svg className="w-4 h-4 text-white/60 group-hover:text-white/90 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6v12z"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="max-w-2xl w-full">
                      <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-sm border-l-4 border-emerald-400 rounded-r-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
                              Student Response
                            </span>
                            <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 mt-1"></div>
                          </div>
                        </div>
                        <blockquote className="relative">
                          <div className="absolute -left-2 top-0 text-6xl text-emerald-400/30 font-serif leading-none">"</div>
                          <p className="text-xl text-gray-100 leading-relaxed font-medium italic pl-6">
                            {currentMessage.text}
                          </p>
                          <div className="absolute -right-2 bottom-0 text-6xl text-emerald-400/30 font-serif leading-none transform rotate-180">"</div>
                        </blockquote>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-gray-800/50 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-center items-center gap-8">
            <button
              onClick={goPrevious}
              disabled={currentIndex === 0}
              className="group p-2 text-gray-500 hover:text-gray-300 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous (or scroll up)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6v12z"/>
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500 font-mono">
                {currentIndex + 1} / {dialogue.length}
              </div>
              <div className="w-32 bg-gray-800/50 rounded-full h-1">
                <div 
                  className="bg-gray-600 h-1 rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / dialogue.length) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 font-light">
                Scroll to navigate
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={currentIndex >= dialogue.length - 1}
              className="group p-2 text-gray-500 hover:text-gray-300 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next (or scroll down)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6v12z"/>
              </svg>
            </button>

            {currentIndex >= dialogue.length - 1 && (
              <button
                onClick={reset}
                className="group flex items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-gray-400 border border-gray-700/50 hover:border-gray-600/50 rounded-full transition-all duration-200 ml-4"
                title="Start over"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 12a8 8 0 018-8V2.5A1.5 1.5 0 0113.5 1h-3A1.5 1.5 0 009 2.5V4a8 8 0 108 8h1.5a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5H12a8 8 0 01-8-8z"/>
                </svg>
                <span>Restart</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Modal Popup */}
      {showContentModal && currentMessage.sidebarContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowContentModal(false)}
          />
          
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-medium text-white">
                  {currentMessage.sidebarContent.type === 'image' && 'Visual Reference'}
                  {currentMessage.sidebarContent.type === 'video' && 'Watch & Learn'}
                  {currentMessage.sidebarContent.type === 'quiz' && 'Quick Quiz'}
                </h3>
                <button
                  onClick={() => setShowContentModal(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {currentMessage.sidebarContent.type === 'image' && (
                  <div className="space-y-4">
                    <img 
                      src={currentMessage.sidebarContent.src} 
                      alt={currentMessage.sidebarContent.alt}
                      className="w-full rounded-xl shadow-lg"
                    />
                    <p className="text-gray-400 text-center">{currentMessage.sidebarContent.alt}</p>
                  </div>
                )}

                {currentMessage.sidebarContent.type === 'video' && (
                  <div className="space-y-4">
                    <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                      <iframe
                        src={currentMessage.sidebarContent.src}
                        title={currentMessage.sidebarContent.title}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                    <p className="text-gray-400 text-center">{currentMessage.sidebarContent.title}</p>
                  </div>
                )}

                {currentMessage.sidebarContent.type === 'quiz' && (
                  <div className="space-y-6">
                    <p className="text-xl text-gray-200 text-center font-medium">{currentMessage.sidebarContent.question}</p>
                    <div className="grid gap-3 max-w-2xl mx-auto">
                      {currentMessage.sidebarContent.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuizAnswer(index)}
                          disabled={showQuizResult}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                            showQuizResult
                              ? index === currentMessage.sidebarContent.correctAnswer
                                ? 'bg-green-900 border-green-600 text-green-100'
                                : index === selectedQuizAnswer && index !== currentMessage.sidebarContent.correctAnswer
                                ? 'bg-red-900 border-red-600 text-red-100'
                                : 'bg-gray-800 border-gray-700 text-gray-300'
                              : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                        </button>
                      ))}
                    </div>
                    {showQuizResult && (
                      <div className={`p-6 rounded-xl max-w-2xl mx-auto ${
                        selectedQuizAnswer === currentMessage.sidebarContent.correctAnswer
                          ? 'bg-green-900 border border-green-600'
                          : 'bg-red-900 border border-red-600'
                      }`}>
                        <p className="text-lg font-medium mb-3">
                          {selectedQuizAnswer === currentMessage.sidebarContent.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                        </p>
                        <p className="text-sm opacity-90">
                          {currentMessage.sidebarContent.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}