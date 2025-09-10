import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import ThreeBackground from "./ThreeBackground";
import courseDataJson from "../data/courseData.json";

const courseData = courseDataJson.sections;
const courseConfig = courseDataJson.config;
const resourcesData = courseDataJson.resources;

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

// OpenAI API integration function
const callOpenAIAPI = async (question, conversationContext) => {
  try {
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.'
      };
    }

    // Note: Replace with your actual OpenAI API endpoint and key
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a chemistry tutor with access to a chemistry textbook via RAG. The student is currently in a conversation about chemistry. Current context: ${conversationContext}. Please provide a helpful, educational response to their question.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      response: data.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to get AI response'
    };
  }
};

// Helper function to get conversation context
const getConversationContext = (currentIndex, allConversations) => {
  const current = allConversations[currentIndex];
  const contextRange = 5; // Include 5 messages before current
  const startIndex = Math.max(0, currentIndex - contextRange);
  const contextMessages = allConversations.slice(startIndex, currentIndex + 1);
  
  return {
    currentSection: current?.sectionTitle || 'Unknown',
    currentSubsection: current?.subsectionTitle || 'Unknown',
    recentConversation: contextMessages.map(msg => `${msg.speaker}: ${msg.text}`).join('\n'),
    currentMessage: `${current?.speaker}: ${current?.text}`
  };
};

const dialogue = getAllConversations();

// Local storage helper functions
const STORAGE_KEYS = {
  PROGRESS: `${courseConfig.storagePrefix}_progress`,
  STATS: `${courseConfig.storagePrefix}_stats`,
  CURRENT_INDEX: `${courseConfig.storagePrefix}_current_index`,
  AI_RESPONSES: `${courseConfig.storagePrefix}_ai_responses`,
  NOTES: `${courseConfig.storagePrefix}_notes`
};

const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

// Convert Sets to Arrays for storage and back
const serializeStats = (stats) => ({
  ...stats,
  quizzesCompleted: Array.from(stats.quizzesCompleted),
  imagesViewed: Array.from(stats.imagesViewed),
  videosWatched: Array.from(stats.videosWatched),
  messagesViewed: Array.from(stats.messagesViewed),
  sectionsVisited: Array.from(stats.sectionsVisited),
  subsectionsVisited: Array.from(stats.subsectionsVisited)
});

const deserializeStats = (stats) => ({
  ...stats,
  quizzesCompleted: new Set(stats.quizzesCompleted || []),
  imagesViewed: new Set(stats.imagesViewed || []),
  videosWatched: new Set(stats.videosWatched || []),
  messagesViewed: new Set(stats.messagesViewed || []),
  sectionsVisited: new Set(stats.sectionsVisited || []),
  subsectionsVisited: new Set(stats.subsectionsVisited || [])
});

export default function ConversationPage({ onSpeakerChange }) {
  // Load initial state from localStorage
  const [currentIndex, setCurrentIndex] = useState(() => 
    loadFromLocalStorage(STORAGE_KEYS.CURRENT_INDEX, 0)
  );
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState('');
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set([1])); // First section expanded by default
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(3000); // milliseconds between messages
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showResourcesPanel, setShowResourcesPanel] = useState(false);
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiResponses, setAiResponses] = useState(() => 
    loadFromLocalStorage(STORAGE_KEYS.AI_RESPONSES, [])
  );
  const [showAIChatPanel, setShowAIChatPanel] = useState(false);
  const [showAIFullscreen, setShowAIFullscreen] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [notesList, setNotesList] = useState(() => {
    const saved = loadFromLocalStorage(STORAGE_KEYS.NOTES, []);
    // Ensure we always have an array, even if old data was stored as string
    return Array.isArray(saved) ? saved : [];
  });
  const [showRightAssets, setShowRightAssets] = useState(true);
  const [aiChatContextIndex, setAiChatContextIndex] = useState(null);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', timestamp: null, id: null });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [contentStats, setContentStats] = useState(() => {
    const defaultStats = {
      quizzesCompleted: new Set(),
      imagesViewed: new Set(),
      videosWatched: new Set(),
      messagesViewed: new Set(),
      sectionsVisited: new Set(),
      subsectionsVisited: new Set(),
      correctAnswers: 0,
      totalQuizAttempts: 0
    };
    const savedStats = loadFromLocalStorage(STORAGE_KEYS.STATS, defaultStats);
    return deserializeStats(savedStats);
  });

  useEffect(() => {
    setSelectedQuizAnswer(null);
    setShowQuizResult(false);
    setShowMobileSidebar(false);
    setShowContentModal(false);
    setSelectedContentType('');
    setSelectedContentIndex(0);
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
        setIsAutoplay(false); // Pause autoplay when user scrolls manually
        setCurrentIndex(prev => {
          const next = prev < dialogue.length - 1 ? prev + 1 : prev;
          console.log('Moving from', prev, 'to', next);
          return next;
        });
      } else if (e.deltaY < 0) {
        // Scroll up - previous message
        setIsAutoplay(false); // Pause autoplay when user scrolls manually
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
      }, 300);
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
        setIsAutoplay(false); // Pause autoplay when user swipes manually
        setCurrentIndex(prev => {
          const next = prev < dialogue.length - 1 ? prev + 1 : prev;
          console.log('Touch: Moving from', prev, 'to', next);
          return next;
        });
      } else {
        // Swipe down - previous message
        setIsAutoplay(false); // Pause autoplay when user swipes manually
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
      }, 300);
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
      setIsAutoplay(false); // Pause autoplay when user navigates manually
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setIsAutoplay(false); // Pause autoplay when user navigates manually
      setCurrentIndex(currentIndex - 1);
    }
  };

  const reset = () => {
    setIsAutoplay(false); // Pause autoplay when user resets
    setCurrentIndex(0);
  };

  // Download functionality
  const handleResourceDownload = (resource) => {
    try {
      // In a real application, you would handle actual file downloads
      // For demo purposes, we'll just show an alert and log the action
      console.log(`Downloading resource: ${resource.title}`);
      
      // You could implement actual download logic here:
      // window.open(resource.downloadUrl, '_blank');
      // or use a more sophisticated download manager
      
      alert(`Download started for: ${resource.title}\n\nFile: ${resource.format}\nSize: ${resource.fileSize}\n\nNote: This is a demo - in a real app, the file would download.`);
      
      // Track download in analytics (optional)
      // trackResourceDownload(resource.id, resource.type);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleBulkDownload = () => {
    try {
      const totalResources = resourcesData.reduce((total, section) => total + section.resources.length, 0);
      const totalSize = resourcesData.reduce((total, section) => 
        total + section.resources.reduce((sectionTotal, resource) => {
          const size = parseFloat(resource.fileSize);
          return sectionTotal + (isNaN(size) ? 0 : size);
        }, 0), 0
      );

      console.log(`Bulk download initiated: ${totalResources} files, ${totalSize.toFixed(1)} MB total`);
      
      // In a real application, you would:
      // 1. Create a ZIP file with all resources
      // 2. Start the download
      // 3. Show progress indicator
      
      alert(`Bulk download started!\n\nFiles: ${totalResources} resources\nTotal size: ${totalSize.toFixed(1)} MB\n\nNote: This is a demo - in a real app, a ZIP file would download with all resources.`);
      
    } catch (error) {
      console.error('Bulk download failed:', error);
      alert('Bulk download failed. Please try again.');
    }
  };

  // Function to clear all progress (for development/testing or user reset)
  const clearAllProgress = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_INDEX);
      localStorage.removeItem(STORAGE_KEYS.STATS);
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      
      // Reset all state
      setCurrentIndex(0);
      setContentStats({
        quizzesCompleted: new Set(),
        imagesViewed: new Set(),
        videosWatched: new Set(),
        messagesViewed: new Set(),
        sectionsVisited: new Set(),
        subsectionsVisited: new Set(),
        correctAnswers: 0,
        totalQuizAttempts: 0
      });
      setIsAutoplay(false);
      
      console.log('All progress cleared successfully');
    } catch (error) {
      console.warn('Failed to clear progress:', error);
    }
  };

  const handleQuizAnswer = (answerIndex) => {
    setSelectedQuizAnswer(answerIndex);
    setShowQuizResult(true);
    
    // Track quiz statistics
    const currentQuizContent = groupedContent[selectedContentType][selectedContentIndex];
    const quizId = `${currentIndex}-${selectedContentType}-${selectedContentIndex}`;
    const isCorrect = answerIndex === currentQuizContent.correctAnswer;
    
    setContentStats(prev => ({
      ...prev,
      quizzesCompleted: new Set([...prev.quizzesCompleted, quizId]),
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      totalQuizAttempts: prev.totalQuizAttempts + 1
    }));
  };

  // Track content modal opens
  const handleContentModalOpen = (contentType, contentIndex) => {
    setSelectedContentType(contentType);
    setSelectedContentIndex(contentIndex);
    setShowContentModal(true);
    
    // Track content interactions
    const contentId = `${currentIndex}-${contentType}-${contentIndex}`;
    
    setContentStats(prev => {
      const newStats = { ...prev };
      if (contentType === 'image') {
        newStats.imagesViewed = new Set([...prev.imagesViewed, contentId]);
      } else if (contentType === 'video') {
        newStats.videosWatched = new Set([...prev.videosWatched, contentId]);
      }
      return newStats;
    });
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

  // Question handling functions
  const handleQuestionSubmit = async () => {
    if (!userQuestion.trim()) return;
    
    setIsLoadingAI(true);
    
    // Use the selected message context if available, otherwise use current message
    const messageContextIndex = aiChatContextIndex !== null ? aiChatContextIndex : currentIndex;
    const allConversations = getAllConversations();
    const context = getConversationContext(messageContextIndex, allConversations);
    
    const contextString = `
      Current Section: ${context.currentSection}
      Current Subsection: ${context.currentSubsection}
      Recent Conversation:
      ${context.recentConversation}
      Current Message: ${context.currentMessage}
    `;
    
    const aiResult = await callOpenAIAPI(userQuestion, contextString);
    
    if (aiResult.success) {
      // Create a new AI response entry
      const newAIResponse = {
        id: Date.now(),
        question: userQuestion,
        answer: aiResult.response,
        contextIndex: messageContextIndex,
        timestamp: new Date().toISOString(),
        sectionTitle: context.currentSection,
        subsectionTitle: context.currentSubsection
      };
      
      setAiResponses(prev => [...prev, newAIResponse]);
      
      // Clear the input
      setUserQuestion('');
      setShowQuestionInput(false);
      
    } else {
      // Show error in a more user-friendly way
      const errorResponse = {
        id: Date.now(),
        question: userQuestion,
        answer: `❌ **Error getting AI response:** ${aiResult.error}\n\nPlease check your internet connection and API configuration.`,
        contextIndex: messageContextIndex,
        timestamp: new Date().toISOString(),
        sectionTitle: context.currentSection,
        subsectionTitle: context.currentSubsection,
        isError: true
      };
      
      setAiResponses(prev => [...prev, errorResponse]);
      setUserQuestion('');
      setShowQuestionInput(false);
    }
    
    setIsLoadingAI(false);
  };

  const toggleQuestionInput = () => {
    setShowQuestionInput(!showQuestionInput);
    setUserQuestion('');
  };

  const openAIChatForMessage = (messageIndex) => {
    setAiChatContextIndex(messageIndex);
    setShowAIChatPanel(true);
    setShowQuestionInput(false);
    setUserQuestion('');
  };

  const handleAIQuestion = () => {
    handleQuestionSubmit();
  };

  // Notes functionality - Multiple Notes System
  const saveNote = () => {
    if (!currentNote.title.trim() || !currentNote.content.trim()) {
      alert('Please enter both title and content for the note.');
      return;
    }

    const note = {
      id: editingNoteId || Date.now(),
      title: currentNote.title.trim(),
      content: currentNote.content.trim(),
      timestamp: new Date().toISOString(),
      sectionTitle: currentMessage.sectionTitle,
      subsectionTitle: currentMessage.subsectionTitle,
      messageIndex: currentIndex
    };

    if (editingNoteId) {
      // Update existing note
      setNotesList(prev => prev.map(n => n.id === editingNoteId ? note : n));
      setEditingNoteId(null);
    } else {
      // Add new note
      setNotesList(prev => [...prev, note]);
    }

    // Reset form
    setCurrentNote({ title: '', content: '', timestamp: null, id: null });
    setShowNoteInput(false);
  };

  const editNote = (noteId) => {
    const noteToEdit = notesList.find(n => n.id === noteId);
    if (noteToEdit) {
      setCurrentNote({
        title: noteToEdit.title,
        content: noteToEdit.content,
        timestamp: noteToEdit.timestamp,
        id: noteToEdit.id
      });
      setEditingNoteId(noteId);
      setShowNoteInput(true);
    }
  };

  const deleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotesList(prev => prev.filter(n => n.id !== noteId));
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setCurrentNote({ title: '', content: '', timestamp: null, id: null });
        setShowNoteInput(false);
      }
    }
  };

  const addNewNote = () => {
    setCurrentNote({ title: '', content: '', timestamp: null, id: null });
    setEditingNoteId(null);
    setShowNoteInput(true);
  };

  const cancelNoteEdit = () => {
    setCurrentNote({ title: '', content: '', timestamp: null, id: null });
    setEditingNoteId(null);
    setShowNoteInput(false);
  };

  const downloadNotesAsPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      
      // PDF settings
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 8;
      const maxWidth = pageWidth - 2 * margin;
      
      // Add title
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('Chemistry Course Notes', margin, margin + 10);
      
      // Add timestamp
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Generated: ${date}`, margin, margin + 25);
      pdf.text(`Total Notes: ${notesList.length}`, margin, margin + 35);
      
      let yPosition = margin + 50;
      
      if (notesList.length > 0) {
        // Sort notes by timestamp
        const sortedNotes = [...notesList].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        sortedNotes.forEach((note, index) => {
          // Check if we need a new page
          if (yPosition + 60 > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin + 10;
          }
          
          // Note header
          pdf.setFontSize(14);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${index + 1}. ${note.title}`, margin, yPosition);
          yPosition += 12;
          
          // Note metadata
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'normal');
          const noteDate = new Date(note.timestamp).toLocaleDateString();
          pdf.text(`Topic: ${note.sectionTitle} - ${note.subsectionTitle} | ${noteDate}`, margin, yPosition);
          yPosition += 12;
          
          // Note content
          pdf.setFontSize(12);
          const contentLines = pdf.splitTextToSize(note.content, maxWidth);
          
          for (let i = 0; i < contentLines.length; i++) {
            if (yPosition + lineHeight > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin + 10;
            }
            pdf.text(contentLines[i], margin, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += 15; // Space between notes
        });
      } else {
        pdf.setFont(undefined, 'italic');
        pdf.text('No notes have been created yet.', margin, yPosition);
      }
      
      // Add footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(
          `Chemistry Course Notes - Page ${i} of ${totalPages}`, 
          pageWidth / 2, 
          pageHeight - 10, 
          { align: 'center' }
        );
      }
      
      // Download PDF
      pdf.save(`chemistry-notes-${date.replace(/[^0-9]/g, '')}.pdf`);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const clearAllNotes = () => {
    if (window.confirm(`Are you sure you want to delete all ${notesList.length} notes? This action cannot be undone.`)) {
      setNotesList([]);
      setCurrentNote({ title: '', content: '', timestamp: null, id: null });
      setEditingNoteId(null);
      setShowNoteInput(false);
    }
  };

  const currentMessage = dialogue[currentIndex];

  // Helper function to group content by type
  const getGroupedContent = (sidebarContent) => {
    if (!sidebarContent || !Array.isArray(sidebarContent)) return {};
    
    const grouped = {};
    sidebarContent.forEach((content) => {
      if (!grouped[content.type]) {
        grouped[content.type] = [];
      }
      grouped[content.type].push(content);
    });
    return grouped;
  };

  const groupedContent = getGroupedContent(currentMessage?.sidebarContent);

  // Track message views, sections, and subsections
  useEffect(() => {
    if (currentMessage) {
      setContentStats(prev => ({
        ...prev,
        messagesViewed: new Set([...prev.messagesViewed, currentIndex]),
        sectionsVisited: new Set([...prev.sectionsVisited, currentMessage.sectionId]),
        subsectionsVisited: new Set([...prev.subsectionsVisited, `${currentMessage.sectionId}-${currentMessage.subsectionId}`])
      }));
    }
  }, [currentIndex, currentMessage]);

  // Helper function to calculate total content statistics
  const getTotalContentStats = () => {
    let totalQuizzes = 0;
    let totalImages = 0;
    let totalVideos = 0;
    let totalMessages = dialogue.length;
    let totalSections = courseData.length;
    let totalSubsections = 0;

    // Calculate subsections and content
    courseData.forEach(section => {
      totalSubsections += section.subsections.length;
    });

    dialogue.forEach(message => {
      if (message.sidebarContent && Array.isArray(message.sidebarContent)) {
        message.sidebarContent.forEach(content => {
          if (content.type === 'quiz') totalQuizzes++;
          if (content.type === 'image') totalImages++;
          if (content.type === 'video') totalVideos++;
        });
      }
    });

    return { totalQuizzes, totalImages, totalVideos, totalMessages, totalSections, totalSubsections };
  };

  const totalStats = getTotalContentStats();

  useEffect(() => {
    if (onSpeakerChange) {
      onSpeakerChange(currentMessage?.speaker);
    }
  }, [currentMessage, onSpeakerChange]);

  // Autoplay functionality
  useEffect(() => {
    let autoplayInterval;
    
    if (isAutoplay && currentIndex < dialogue.length - 1) {
      autoplayInterval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < dialogue.length - 1) {
            return prev + 1;
          } else {
            setIsAutoplay(false); // Stop autoplay at the end
            return prev;
          }
        });
      }, autoplaySpeed);
    }

    return () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    };
  }, [isAutoplay, currentIndex, autoplaySpeed, dialogue.length]);

  // Save current index to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CURRENT_INDEX, currentIndex);
  }, [currentIndex]);

  // Save content stats to localStorage whenever they change
  useEffect(() => {
    const serializedStats = serializeStats(contentStats);
    saveToLocalStorage(STORAGE_KEYS.STATS, serializedStats);
  }, [contentStats]);

  // Save AI responses to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.AI_RESPONSES, aiResponses);
  }, [aiResponses]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.NOTES, notesList);
  }, [notesList]);

  // Keyboard shortcuts for notes
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Arrow key navigation between conversations
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target;
        const tag = target?.tagName?.toLowerCase();
        const isTyping = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
        if (!isTyping) {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCurrentIndex((prev) => Math.max(0, prev - 1));
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCurrentIndex((prev) => Math.min(dialogue.length - 1, prev + 1));
            return;
          }
        }
      }

      // Ctrl/Cmd + Shift + N to toggle notes panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setShowNotesPanel(prev => !prev);
      }
      // Ctrl/Cmd + S to download notes (when notes panel is open)
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && showNotesPanel && notesList.length > 0) {
        e.preventDefault();
        downloadNotesAsPDF();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showNotesPanel, notesList]);

  // Save general progress data
  useEffect(() => {
    const progressData = {
      lastAccessed: new Date().toISOString(),
      currentMessage: currentIndex,
      totalMessages: dialogue.length,
      completionPercentage: Math.round((contentStats.messagesViewed.size / dialogue.length) * 100)
    };
    saveToLocalStorage(STORAGE_KEYS.PROGRESS, progressData);
  }, [currentIndex, contentStats.messagesViewed.size, dialogue.length]);

  // Check if user has returning progress on component mount
  useEffect(() => {
    const savedProgress = loadFromLocalStorage(STORAGE_KEYS.PROGRESS, null);
    if (savedProgress && savedProgress.currentMessage > 0) {
      console.log(`Welcome back! Resuming from message ${savedProgress.currentMessage + 1} of ${savedProgress.totalMessages}`);
      console.log(`Course completion: ${savedProgress.completionPercentage}%`);
    }
  }, []);

  return (
    <div className="h-screen bg-transparent text-white flex overflow-hidden relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 text-center py-12 px-6">
        <div className="space-y-2">
          <p className="text-2xl">Ncert :  Class 11 : Chapter 1: Some basic concepts of chemistry</p>
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

      {/* Notes, Stats, Assets, and Resources Toggle Buttons (moved to left beside menu) */}
      {!showLeftSidebar && (
      <div className="fixed top-6 left-16 flex gap-2" style={{ zIndex: 9999 }}>
        <button
          onClick={() => setShowNotesPanel(!showNotesPanel)}
          className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          title="Toggle notes panel"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </button>
        
        {/* Toggle Right Assets Sidebar */}
        <button
          onClick={() => setShowRightAssets(!showRightAssets)}
          className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          title={showRightAssets ? 'Collapse assets panel' : 'Expand assets panel'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            {showRightAssets ? (
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            ) : (
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            )}
          </svg>
        </button>

        <button
          onClick={() => setShowStatsPanel(!showStatsPanel)}
          className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          title="Toggle learning statistics"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3v18h18v-2H5V3H3zm16 6l-3-3-3 3-4-4-2 2v2h2l2-2 4 4 3-3 3 3V9h-2z"/>
          </svg>
        </button>

        {/* Toggle Resources Panel */}
        <button
          onClick={() => setShowResourcesPanel(!showResourcesPanel)}
          className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          title="Toggle downloadable resources"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-5.5-6L9 18h10l-3.5-4z"/>
          </svg>
        </button>
      </div>
      )}


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
          {/* When sidebar is open, show the action buttons below the header */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowNotesPanel(!showNotesPanel)}
              className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
              title="Toggle notes panel"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </button>

            <button
              onClick={() => setShowRightAssets(!showRightAssets)}
              className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
              title={showRightAssets ? 'Collapse assets panel' : 'Expand assets panel'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                {showRightAssets ? (
                  <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
                ) : (
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                )}
              </svg>
            </button>

            <button
              onClick={() => setShowStatsPanel(!showStatsPanel)}
              className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
              title="Toggle learning statistics"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3v18h18v-2H5V3H3zm16 6l-3-3-3 3-4-4-2 2v2h2l2-2 4 4 3-3 3 3V9h-2z"/>
              </svg>
            </button>

            <button
              onClick={() => setShowResourcesPanel(!showResourcesPanel)}
              className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
              title="Toggle downloadable resources"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-5.5-6L9 18h10l-3.5-4z"/>
              </svg>
            </button>

            <button
              onClick={() => setShowAIChatPanel(!showAIChatPanel)}
              className="bg-gray-900 border border-gray-700 text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
              title="Toggle AI chat panel"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6 sections-tree-scroll">
            <div className="space-y-1">
              {courseData.map((section, sectionIndex) => (
                <div key={section.id}>
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-start gap-2 w-full p-3 text-left hover:bg-gray-800 rounded transition-colors duration-150"
                    >
                      <div className="flex items-center justify-center w-4 h-4 mt-0.5">
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
                      
                      <div className="w-5 h-5 rounded bg-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white">{section.title}</h3>
                        <p className="text-xs text-gray-400 leading-tight mt-0.5">{section.description}</p>
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
                        const hasContent = subsection.conversations.some(conv => conv.sidebarContent && conv.sidebarContent.length > 0);
                        
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
                                  <h4 className="text-sm font-medium">{subsection.title}</h4>
                                  {hasContent && (
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 leading-tight mt-0.5">{subsection.description}</p>
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

      {/* Notes Panel */}
      <div 
        data-sidebar
        className={`fixed top-0 right-0 h-full w-96 bg-gray-950 border-l border-gray-800 z-50 transform transition-transform duration-300 ${
          showNotesPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
        onWheel={(e) => {
          // Prevent wheel events from propagating to the main page
          e.stopPropagation();
        }}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Study Notes</h2>
            <button
              onClick={() => setShowNotesPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">{courseConfig.notesSubtitle}</p>
        </div>
        
        <div className="flex-1 flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {/* Add New Note Button */}
          <div className="p-4 border-b border-gray-800">
            <button
              onClick={addNewNote}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add New Note
            </button>
          </div>

          {/* Note Input Form */}
          {showNoteInput && (
            <div className="border-b border-gray-800 bg-gray-900/30">
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={currentNote.title}
                    onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter note title..."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Note Content
                  </label>
                  <textarea
                    value={currentNote.content}
                    onChange={(e) => setCurrentNote(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your note here..."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveNote}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17,3H5C3.89,3 3,3.9 3,5V19C3,20.1 3.89,21 5,21H19C20.1,21 21,20.1 21,19V7L17,3M19,19H5V5H16.17L19,7.83V19M12,12C13.66,12 15,13.34 15,15C15,16.66 13.66,18 12,18C10.34,18 9,16.66 9,15C9,13.34 10.34,12 12,12Z"/>
                    </svg>
                    {editingNoteId ? 'Update Note' : 'Save Note'}
                  </button>
                  <button
                    onClick={cancelNoteEdit}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {Array.isArray(notesList) && notesList.length > 0 ? (
              notesList.map((note) => (
                <div key={note.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium text-lg line-clamp-1">{note.title}</h3>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => editNote(note.id)}
                        className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition-all"
                        title="Edit note"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-all"
                        title="Delete note"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-3">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{note.sectionTitle} - {note.subsectionTitle}</span>
                    <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <p className="text-gray-400 font-medium mb-2">No notes yet</p>
                <p className="text-sm text-gray-500">Click "Add New Note" to create your first note</p>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-gray-800 p-4 space-y-3">
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>Total notes: {notesList.length}</span>
              <span>Topic: {currentMessage.sectionTitle}</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={downloadNotesAsPDF}
                disabled={notesList.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Export PDF
              </button>
              
              <button
                onClick={clearAllNotes}
                disabled={notesList.length === 0}
                className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-600/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Panel */}
      <div 
        data-sidebar
        className={`fixed top-0 right-0 h-full w-80 bg-gray-950 border-l border-gray-800 z-40 transform transition-transform duration-300 ${
          showResourcesPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
        onWheel={(e) => {
          // Prevent wheel events from propagating to the main page
          e.stopPropagation();
        }}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Downloadable Resources</h2>
            <button
              onClick={() => setShowResourcesPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto stats-panel-scroll" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="p-6 space-y-6">
            {resourcesData.map((section) => (
              <div key={section.sectionId} className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-4 border border-indigo-800/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{section.sectionTitle}</h3>
                    <p className="text-indigo-300 text-sm">{section.resources.length} resources available</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {section.resources.map((resource) => (
                    <div key={resource.id} className="bg-black/20 rounded-lg p-3 hover:bg-black/30 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-700">
                            {resource.type === 'flashcards' && (
                              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                              </svg>
                            )}
                            {resource.type === 'worksheet' && (
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                              </svg>
                            )}
                            {resource.type === 'report' && (
                              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                              </svg>
                            )}
                            {resource.type === 'video' && (
                              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                              </svg>
                            )}
                            {resource.type === 'simulation' && (
                              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm leading-tight">{resource.title}</h4>
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{resource.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">{resource.format}</span>
                              <span className="text-xs text-gray-500">{resource.fileSize}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleResourceDownload(resource)}
                          className="ml-2 p-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 hover:border-indigo-400 text-indigo-300 hover:text-indigo-200 rounded-lg transition-all duration-200 group-hover:scale-105"
                          title={`Download ${resource.title}`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Summary */}
                <div className="mt-4 pt-3 border-t border-indigo-800/30">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-indigo-300">Total Resources</span>
                    <span className="text-white font-mono">{section.resources.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-indigo-300">Est. Download Size</span>
                    <span className="text-white font-mono">
                      {section.resources.reduce((total, resource) => {
                        const size = parseFloat(resource.fileSize);
                        return total + (isNaN(size) ? 0 : size);
                      }, 0).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Download All Section */}
            <div className="bg-gradient-to-br from-gray-900/30 to-slate-900/30 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Complete Resource Pack</h3>
                  <p className="text-gray-400 text-sm">All materials in one download</p>
                </div>
              </div>
              <button
                onClick={() => handleBulkDownload()}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Download All Resources
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Total size: ~{resourcesData.reduce((total, section) => 
                  total + section.resources.reduce((sectionTotal, resource) => {
                    const size = parseFloat(resource.fileSize);
                    return sectionTotal + (isNaN(size) ? 0 : size);
                  }, 0), 0
                ).toFixed(1)} MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <div 
        data-sidebar
        className={`fixed top-0 right-0 h-full w-96 bg-gray-950 border-l border-gray-800 z-50 transform transition-transform duration-300 ${
          showAIChatPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
        onWheel={(e) => {
          // Prevent wheel events from propagating to the main page
          e.stopPropagation();
        }}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">AI Assistant</h2>
              {aiChatContextIndex !== null && (
                <p className="text-sm text-gray-400 mt-1">
                  Discussing: {dialogue[aiChatContextIndex]?.speaker === "Teacher" ? "Instructor" : "Student"} message
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setShowAIChatPanel(false);
                setAiChatContextIndex(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          {aiChatContextIndex === null && (
            <p className="text-sm text-gray-400 mt-1">Ask questions about the current topic</p>
          )}
        </div>
        
        <div className="flex-1 flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {/* AI Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(() => {
              // Filter AI responses by the selected message context
              const filteredResponses = aiChatContextIndex !== null 
                ? aiResponses.filter(response => response.contextIndex === aiChatContextIndex)
                : aiResponses;
              
              if (filteredResponses.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                      </svg>
                    </div>
                    <p className="text-gray-400 font-medium">
                      {aiChatContextIndex !== null ? 'No questions asked about this message yet' : 'No AI conversations yet'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {aiChatContextIndex !== null ? 'Ask your first question about this message below' : 'Ask your first question below'}
                    </p>
                  </div>
                );
              }
              
              return filteredResponses.map((response) => (
                <div key={response.id} className="space-y-3">
                  {/* User Question */}
                  <div className="flex justify-end">
                    <div className="max-w-xs bg-blue-600 text-white p-3 rounded-lg rounded-br-sm">
                      <p className="text-sm">{response.question}</p>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-xs p-3 rounded-lg rounded-bl-sm ">
                      <div className="flex justify-start">
  <div className="max-w-xs p-3 rounded-lg rounded-bl-sm ">
    <ReactMarkdown >{response.answer}</ReactMarkdown>
  </div>
</div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Question Input */}
          <div className="p-4 border-t border-gray-800">
            {showQuestionInput ? (
              <div className="space-y-3">
                <textarea
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Ask anything about this topic..."
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={toggleQuestionInput}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuestionSubmit}
                    disabled={!userQuestion.trim() || isLoadingAI}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isLoadingAI ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Thinking...
                      </>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={toggleQuestionInput}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                Ask AI Assistant
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Stats Panel */}
      <div 
        data-sidebar
        className={`fixed top-0 right-0 h-full w-80 bg-gray-950 border-l border-gray-800 z-40 transform transition-transform duration-300 ${
          showStatsPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
        onWheel={(e) => {
          // Prevent wheel events from propagating to the main page
          e.stopPropagation();
        }}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Learning Analytics</h2>
            <button
              onClick={() => setShowStatsPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto stats-panel-scroll" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="p-6 space-y-6">
            {/* Overall Progress */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-xl p-4 border border-emerald-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Overall Progress</h3>
                  <p className="text-emerald-300 text-sm">Your learning journey</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Messages Viewed</span>
                  <span className="text-white font-mono">
                    {contentStats.messagesViewed.size}/{totalStats.totalMessages}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Sections Explored</span>
                  <span className="text-white font-mono">
                    {contentStats.sectionsVisited.size}/{totalStats.totalSections}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Subsections Visited</span>
                  <span className="text-white font-mono">
                    {contentStats.subsectionsVisited.size}/{totalStats.totalSubsections}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(contentStats.messagesViewed.size / totalStats.totalMessages) * 100}%` }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-emerald-300 text-lg font-semibold">
                    {Math.round((contentStats.messagesViewed.size / totalStats.totalMessages) * 100)}%
                  </span>
                  <span className="text-gray-400 text-sm"> Complete</span>
                </div>
              </div>
            </div>

            {/* Quiz Statistics */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Quiz Performance</h3>
                  <p className="text-purple-300 text-sm">Knowledge assessment</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {contentStats.quizzesCompleted.size}
                  </div>
                  <div className="text-xs text-gray-400">
                    of {totalStats.totalQuizzes} Completed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300 mb-1">
                    {contentStats.totalQuizAttempts > 0 
                      ? Math.round((contentStats.correctAnswers / contentStats.totalQuizAttempts) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-400">Accuracy Rate</div>
                </div>
              </div>
              {contentStats.totalQuizAttempts > 0 && (
                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">
                      ✓ {contentStats.correctAnswers} Correct
                    </span>
                    <span className="text-red-400">
                      ✗ {contentStats.totalQuizAttempts - contentStats.correctAnswers} Wrong
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Content Consumption */}
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Content Explored</h3>
                  <p className="text-blue-300 text-sm">Media consumption</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm3 9l3-4 3 4H9z"/>
                    </svg>
                    <span className="text-gray-300 text-sm">Images</span>
                  </div>
                  <span className="text-white font-mono text-sm">
                    {contentStats.imagesViewed.size}/{totalStats.totalImages}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span className="text-gray-300 text-sm">Videos</span>
                  </div>
                  <span className="text-white font-mono text-sm">
                    {contentStats.videosWatched.size}/{totalStats.totalVideos}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Content Engagement</span>
                  <span>
                    {Math.round(((contentStats.imagesViewed.size + contentStats.videosWatched.size) / (totalStats.totalImages + totalStats.totalVideos || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((contentStats.imagesViewed.size + contentStats.videosWatched.size) / (totalStats.totalImages + totalStats.totalVideos || 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Learning Insights */}
            <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-xl p-4 border border-amber-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Learning Insights</h3>
                  <p className="text-amber-300 text-sm">Performance analysis</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {contentStats.messagesViewed.size > 0 && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0"/>
                    <span className="text-gray-300">
                      You've explored <span className="text-emerald-300 font-medium">
                        {Math.round((contentStats.messagesViewed.size / totalStats.totalMessages) * 100)}%
                      </span> of the course content across <span className="text-emerald-300 font-medium">
                        {contentStats.sectionsVisited.size}
                      </span> sections
                    </span>
                  </div>
                )}
                {contentStats.sectionsVisited.size === totalStats.totalSections && contentStats.subsectionsVisited.size < totalStats.totalSubsections && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"/>
                    <span className="text-gray-300">
                      Great progress! You've visited all <span className="text-blue-300 font-medium">
                        {totalStats.totalSections} sections
                      </span> but still have subsections to explore
                    </span>
                  </div>
                )}
                {contentStats.totalQuizAttempts > 0 && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"/>
                    <span className="text-gray-300">
                      Your quiz accuracy is {' '}
                      <span className={`font-medium ${
                        (contentStats.correctAnswers / contentStats.totalQuizAttempts) >= 0.8 
                          ? 'text-green-300' 
                          : (contentStats.correctAnswers / contentStats.totalQuizAttempts) >= 0.6 
                          ? 'text-yellow-300' 
                          : 'text-red-300'
                      }`}>
                        {Math.round((contentStats.correctAnswers / contentStats.totalQuizAttempts) * 100)}%
                      </span>
                    </span>
                  </div>
                )}
                {(contentStats.imagesViewed.size + contentStats.videosWatched.size) > 0 && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"/>
                    <span className="text-gray-300">
                      You've engaged with <span className="text-blue-300 font-medium">
                        {contentStats.imagesViewed.size + contentStats.videosWatched.size}
                      </span> multimedia resources
                    </span>
                  </div>
                )}
                {contentStats.messagesViewed.size === totalStats.totalMessages && (
                  <div className="mt-4 p-3 bg-emerald-900/50 border border-emerald-700/50 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="font-medium">Course Completed!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Management */}
            <div className="bg-gradient-to-br from-gray-900/30 to-slate-900/30 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Progress Management</h3>
                  <p className="text-gray-400 text-sm">Data automatically saved</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Auto-Save Status</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Last Updated</span>
                  <span className="text-gray-400 font-mono text-xs">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={clearAllProgress}
                  className="w-full mt-4 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 hover:border-red-600 text-red-300 hover:text-red-200 rounded-lg text-sm font-medium transition-all duration-200"
                  title="Clear all progress and start over"
                >
                  Reset All Progress
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Your progress is automatically saved in your browser
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col min-h-0 pb-20">
        <div className="flex flex-col min-h-0 w-full">
          <div className="flex-1 flex items-center justify-center py-8 overflow-hidden relative">
            
            <div className="w-full max-w-4xl mx-auto relative z-10 space-y-8 transition-all duration-500 ease-out">
              {/* Display previous message (faded) */}
              {currentIndex > 0 && (
                <div className="transition-all duration-500 ease-out opacity-40 scale-95 transform">
                  {dialogue[currentIndex - 1].speaker === "Teacher" ? (
                    <div className="flex justify-center">
                      <div className="max-w-2xl w-full">
                        <div className="bg-gradient-to-br from-emerald-900/30 to--900/30 backdrop-blur-sm border-l-4 border-emerald-400/50 rounded-r-2xl p-4 shadow-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                              </svg>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-emerald-300/70 uppercase tracking-wider">
                                Instructor
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
                  <div className="flex justify-center">
                    <div className="max-w-2xl w-full">
                      <div className="bg-gradient-to-br from-red-900/50 to-blue-900/50 backdrop-blur-sm border-l-4 border-emerald-400 rounded-r-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
                              Instructor
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
                        
                        {/* Ask Question Button */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => openAIChatForMessage(currentIndex)}
                            className="group flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 rounded-lg transition-all duration-200 text-sm font-medium"
                            title="Ask a question about this message"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                            </svg>
                            Ask Question
                          </button>
                        </div>
                        
                      </div>
                    </div>
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
                        
                        {/* Ask Question Button */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => openAIChatForMessage(currentIndex)}
                            className="group flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 rounded-lg transition-all duration-200 text-sm font-medium"
                            title="Ask a question about this message"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                            </svg>
                            Ask Question
                          </button>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                )}
              </div>



              {/* Subtle preview of next message to encourage continuous flow */}
              {currentIndex < dialogue.length - 1 && (
                <div className="mt-6 opacity-30 scale-95 transition-all duration-500 ease-out">
                  <div className="flex justify-center">
                    <div className="max-w-2xl w-full">
                      <div className="text-xs text-emerald-300/60 mb-2">Up next</div>
                      <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-l-4 border-emerald-400/30 rounded-r-2xl p-3">
                        <p className="text-base text-gray-100/70 leading-relaxed font-medium italic line-clamp-3">
                          {dialogue[currentIndex + 1].text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-gray-800/50 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 h-16">
          <div className="flex justify-center items-center gap-8 h-full">
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
              
              {/* Autoplay Controls */}
              <div className="flex items-center gap-3 ml-2">
                <button
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isAutoplay 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
                  title={isAutoplay ? 'Pause autoplay' : 'Start autoplay'}
                >
                  {isAutoplay ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                
                {/* Speed Control */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Speed</span>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="500"
                    value={autoplaySpeed}
                    onChange={(e) => setAutoplaySpeed(Number(e.target.value))}
                    className="w-16 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 w-8 text-center">
                    {(autoplaySpeed / 1000).toFixed(1)}s
                  </span>
                </div>
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

              <button
                onClick={reset}
                className={`group flex items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-gray-400 border border-gray-700/50 hover:border-gray-600/50 rounded-full transition-all duration-200 ml-4 ${
                  currentIndex >= dialogue.length - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                title="Start over"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 12a8 8 0 018-8V2.5A1.5 1.5 0 0113.5 1h-3A1.5 1.5 0 009 2.5V4a8 8 0 108 8h1.5a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5H12a8 8 0 01-8-8z"/>
                </svg>
                <span>Restart</span>
              </button>
          </div>
        </div>
      </div>

      {/* Content Modal Popup */}
      {showContentModal && selectedContentType && currentMessage.sidebarContent && currentMessage.sidebarContent[selectedContentIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowContentModal(false)}
          />
          
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-medium text-white">
                    {selectedContentType === 'image' && 'Image Resource'}
                    {selectedContentType === 'video' && 'Video Resource'}
                    {selectedContentType === 'quiz' && 'Quiz Challenge'}
                  </h3>
                  {currentMessage.sidebarContent.filter(c => c.type === selectedContentType).length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const sameTypeContent = currentMessage.sidebarContent.filter(c => c.type === selectedContentType);
                          const currentIndexInType = sameTypeContent.findIndex((_, i) => currentMessage.sidebarContent.findIndex(c => c === sameTypeContent[i]) === selectedContentIndex);
                          const prevIndexInType = currentIndexInType > 0 ? currentIndexInType - 1 : sameTypeContent.length - 1;
                          const newGlobalIndex = currentMessage.sidebarContent.findIndex(c => c === sameTypeContent[prevIndexInType]);
                          setSelectedContentIndex(newGlobalIndex);
                        }}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                        title="Previous content"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M15 18l-6-6 6-6v12z"/>
                        </svg>
                      </button>
                      <span className="text-sm text-gray-400">
                        {selectedContentIndex + 1} of {groupedContent[selectedContentType].length}
                      </span>
                      <button
                        onClick={() => setSelectedContentIndex(prev => prev < groupedContent[selectedContentType].length - 1 ? prev + 1 : 0)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                        title="Next content"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6v12z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
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
                {selectedContentType === 'image' && currentMessage.sidebarContent[selectedContentIndex] && (
                  <div className="space-y-4">
                    <img 
                      src={currentMessage.sidebarContent[selectedContentIndex].src} 
                      alt={currentMessage.sidebarContent[selectedContentIndex].alt || 'Educational image'}
                      className="w-full rounded-xl shadow-lg"
                    />
                    <p className="text-gray-400 text-center">{currentMessage.sidebarContent[selectedContentIndex].alt || 'Educational image'}</p>
                  </div>
                )}

                {selectedContentType === 'video' && currentMessage.sidebarContent[selectedContentIndex] && (
                  <div className="space-y-4">
                    <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                      <iframe
                        src={currentMessage.sidebarContent[selectedContentIndex].src}
                        title={currentMessage.sidebarContent[selectedContentIndex].title || 'Educational video'}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                    <p className="text-gray-400 text-center">{currentMessage.sidebarContent[selectedContentIndex].title || 'Educational video'}</p>
                  </div>
                )}

                {selectedContentType === 'quiz' && currentMessage.sidebarContent[selectedContentIndex] && (
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <span className="inline-block px-3 py-1 bg-emerald-600/20 text-emerald-300 text-sm rounded-full">
                        Quiz Challenge
                      </span>
                    </div>
                    <p className="text-xl text-gray-200 text-center font-medium">{currentMessage.sidebarContent[selectedContentIndex].question}</p>
                    <div className="grid gap-3 max-w-2xl mx-auto">
                      {currentMessage.sidebarContent[selectedContentIndex].options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuizAnswer(index)}
                          disabled={showQuizResult}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                            showQuizResult
                              ? index === currentMessage.sidebarContent[selectedContentIndex].correctAnswer
                                ? 'bg-green-900 border-green-600 text-green-100'
                                : index === selectedQuizAnswer && index !== currentMessage.sidebarContent[selectedContentIndex].correctAnswer
                                ? 'bg-red-900 border-red-600 text-red-100'
                                : 'bg-gray-800 border-gray-700 text-gray-300'
                              : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                        </button>
                      )) || []}
                    </div>
                    {showQuizResult && (
                      <div className={`p-6 rounded-xl max-w-2xl mx-auto ${
                        selectedQuizAnswer === currentMessage.sidebarContent[selectedContentIndex].correctAnswer
                          ? 'bg-green-900 border border-green-600'
                          : 'bg-red-900 border border-red-600'
                      }`}>
                        <p className="text-lg font-medium mb-3">
                          {selectedQuizAnswer === currentMessage.sidebarContent[selectedContentIndex].correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                        </p>
                        <p className="text-sm opacity-90">
                          {currentMessage.sidebarContent[selectedContentIndex].explanation}
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

      {/* Right Sidebar - Context-Aware Media Panel */}
      <div className={`hidden lg:flex flex-shrink-0 bg-gray-900/30 backdrop-blur-sm overflow-hidden transition-all duration-300 ${showRightAssets ? 'w-80 border-l border-gray-700/30' : 'w-0 border-l-0'}`}>
        <div className="h-full flex flex-col">
          {/* Content Area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${showRightAssets ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
            aria-hidden={!showRightAssets}
          >
            {currentMessage.sidebarContent && currentMessage.sidebarContent.length > 0 ? (
              currentMessage.sidebarContent.map((content, index) => (
                <div key={index} className="transition-all duration-300">
                  {/* Image Display */}
                  {content.type === 'image' && (
                    <div 
                      className="group cursor-pointer"
                      onClick={() => handleContentModalOpen('image', index)}
                    >
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden hover:border-emerald-400/50 transition-all duration-200">
                        <div className="aspect-video">
                          <img 
                            src={content.src} 
                            alt={content.alt || 'Educational image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm3 9l3-4 3 4H9z"/>
                            </svg>
                            <span className="text-sm font-medium text-emerald-300">Image Resource</span>
                          </div>
                          {content.alt && (
                            <p className="text-xs text-gray-400">{content.alt}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Display */}
                  {content.type === 'video' && (
                    <div 
                      className="group cursor-pointer"
                      onClick={() => handleContentModalOpen('video', index)}
                    >
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden hover:border-emerald-400/50 transition-all duration-200">
                        <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="relative z-10 text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                              <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                            <p className="text-sm text-white/90 font-medium">{content.title || 'Play Video'}</p>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            <span className="text-sm font-medium text-emerald-300">Video Resource</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Quiz Display */}
                  {content.type === 'quiz' && (
                    <div 
                      className="group cursor-pointer"
                      onClick={() => handleContentModalOpen('quiz', index)}
                    >
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-emerald-400/50 transition-all duration-200">
                        <div className="flex items-center gap-3 mb-3">
                          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                          </svg>
                          <span className="text-sm font-medium text-emerald-300">Quiz Challenge</span>
                        </div>
                        <div className="bg-gray-900/30 rounded-md p-3">
                          <p className="text-sm text-gray-200 font-medium mb-2 line-clamp-3">{content.question}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{content.options?.length || 0} options</span>
                            <span>•</span>
                            <span>Multiple choice</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm3 9l3-4 3 4H9z"/>
                  </svg>
                </div>
                <p className="text-gray-400 font-medium">No media content</p>
                <p className="text-sm text-gray-500 mt-1">Related images, videos, and quizzes will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <div 
        data-sidebar
        className={`fixed top-0 right-0 h-full w-96 bg-gray-950 border-l border-gray-800 z-50 transform transition-transform duration-300 ${
          showAIChatPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-white">AI Assistant</h2>
                <button
                  onClick={() => setShowAIFullscreen(true)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
                  title="Open in fullscreen"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setShowAIChatPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1">Ask questions about the current topic</p>
          </div>
          
          <div className="flex-1 flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            {/* AI Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(() => {
                // Filter AI responses by the selected message context
                const currentMessage = dialogue[currentIndex];
                const contextResponses = aiResponses.filter(response => 
                  response.contextMessageId === currentIndex
                );

                if (contextResponses.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                      </div>
                      <p className="text-gray-400 font-medium">No questions yet</p>
                      <p className="text-sm text-gray-500 mt-1">Ask the AI about the current topic</p>
                    </div>
                  );
                }

                return contextResponses.map((response, index) => (
                  <div key={index} className="space-y-3">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="max-w-xs bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-md">
                        <p className="text-sm">{response.question}</p>
                      </div>
                    </div>
                    
                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="max-w-sm bg-gray-800 text-gray-200 p-3 rounded-2xl rounded-tl-md">
                        <p className="text-sm">{response.answer}</p>
                        <p className="text-xs text-gray-500 mt-2">{new Date(response.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Question Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Ask about the current topic..."
                  className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoadingAI) {
                      handleAIQuestion();
                    }
                  }}
                  disabled={isLoadingAI}
                />
                <button
                  onClick={handleAIQuestion}
                  disabled={isLoadingAI || !userQuestion.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  {isLoadingAI ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    'Ask'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Fullscreen Modal */}
      {showAIFullscreen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
                <span className="text-sm text-gray-400">
                  {dialogue[currentIndex] ? 
                    `${dialogue[currentIndex].sectionTitle} • ${dialogue[currentIndex].subsectionTitle}` : 
                    'Current Topic'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIFullscreen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
                  title="Close fullscreen"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 10V7h3V5h-5v5h2zm-4 7h3v2H5v-5h2v3zm2-3.5V17h3v-2h-5v5h2v-3zm4-4.5V5h-2v5h5V7h-3z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setShowAIFullscreen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Fullscreen Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {(() => {
                    const currentMessage = dialogue[currentIndex];
                    const contextResponses = aiResponses.filter(response => 
                      response.contextMessageId === currentIndex
                    );

                    if (contextResponses.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">Start a conversation</h3>
                          <p className="text-gray-400 mb-4">Ask the AI assistant about the current topic or any chemistry concepts</p>
                          <div className="max-w-md">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Example questions:</h4>
                            <ul className="text-sm text-gray-500 space-y-1 text-left">
                              <li>• "Can you explain this concept further?"</li>
                              <li>• "What are some real-world applications?"</li>
                              <li>• "How does this relate to previous topics?"</li>
                              <li>• "Can you give me a practice problem?"</li>
                            </ul>
                          </div>
                        </div>
                      );
                    }

                    return contextResponses.map((response, index) => (
                      <div key={index} className="space-y-4">
                        {/* User Question */}
                        <div className="flex justify-end">
                          <div className="max-w-2xl bg-emerald-600 text-white p-4 rounded-2xl rounded-tr-md">
                            <p className="text-base">{response.question}</p>
                          </div>
                        </div>
                        
                        {/* AI Response */}
                        <div className="flex justify-start">
                          <div className="max-w-3xl bg-gray-800 text-gray-200 p-4 rounded-2xl rounded-tl-md">
                            <p className="text-base leading-relaxed">{response.answer}</p>
                            <p className="text-xs text-gray-500 mt-3">{new Date(response.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Fullscreen Input */}
                <div className="p-6 border-t border-gray-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder="Ask about the current topic or any chemistry concepts..."
                      className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isLoadingAI) {
                          handleAIQuestion();
                        }
                      }}
                      disabled={isLoadingAI}
                    />
                    <button
                      onClick={handleAIQuestion}
                      disabled={isLoadingAI || !userQuestion.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-colors font-medium"
                    >
                      {isLoadingAI ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Thinking...
                        </div>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Context Sidebar */}
              <div className="w-80 border-l border-gray-800 p-6 bg-gray-900/30">
                <h3 className="font-medium text-white mb-4">Current Context</h3>
                {dialogue[currentIndex] && (
                  <div className="space-y-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-emerald-400 mb-1">SECTION</p>
                      <p className="text-sm text-white">{dialogue[currentIndex].sectionTitle}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-400 mb-1">SUBSECTION</p>
                      <p className="text-sm text-white">{dialogue[currentIndex].subsectionTitle}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-purple-400 mb-1">CURRENT MESSAGE</p>
                      <p className="text-sm text-white line-clamp-3">{dialogue[currentIndex].text}</p>
                    </div>
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