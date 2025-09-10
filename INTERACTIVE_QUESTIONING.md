# Interactive Questioning Feature

## Overview
The interactive questioning system allows users to ask questions mid-conversation that are sent to OpenAI's API with contextual information from the chemistry textbook (via RAG). The AI responses are then integrated seamlessly back into the conversation flow.

## Features
- 🤖 **AI-Powered Responses**: Questions are sent to OpenAI GPT-4 with full conversation context
- 📚 **RAG Integration**: AI has access to chemistry textbook knowledge via RAG system
- 💬 **Seamless Integration**: AI responses appear inline with the conversation
- 💾 **Persistent Storage**: All questions and responses are saved in browser localStorage
- 🎨 **Beautiful UI**: Custom-styled question input and response display
- ⚡ **Real-time Loading**: Visual feedback while AI generates responses
- 🔄 **Context Awareness**: AI receives current section, subsection, and recent conversation history
- ❌ **Error Handling**: Graceful error display and fallback messaging

## How It Works

### 1. Question Input Interface
- A floating button appears below each conversation message: "Ask a question about this topic"
- Clicking opens an elegant text area with context information
- Users can type their question and submit to AI

### 2. Context Sending
When a question is submitted, the system sends to OpenAI:
- **Current Section**: e.g., "Introduction to Chemistry"
- **Current Subsection**: e.g., "What is Chemistry?"
- **Recent Conversation**: Last 5 messages for context
- **Current Message**: The specific message user is asking about
- **User Question**: The actual question typed by user

### 3. AI Response Integration
- AI responses appear immediately below the current conversation message
- Each response shows the original question and AI's answer
- Responses are styled with purple/pink gradients to distinguish from regular conversation
- Error responses are styled with red/orange gradients

### 4. Persistent Storage
- All questions and AI responses are saved to browser localStorage
- Data persists across page refreshes and browser sessions
- Questions are linked to specific conversation contexts

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the project root:
```bash
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. OpenAI Account Setup
- Sign up for OpenAI API access
- Ensure your account has access to GPT-4 models
- Set up RAG integration with your chemistry textbook
- Add your API key to the `.env` file

### 3. API Configuration
The system uses OpenAI's Chat Completions API with:
- **Model**: GPT-4 Turbo Preview
- **Max Tokens**: 500 (adjustable)
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **System Prompt**: Includes RAG context and chemistry tutor persona

## Technical Implementation

### State Management
```javascript
const [showQuestionInput, setShowQuestionInput] = useState(false);
const [userQuestion, setUserQuestion] = useState('');
const [isLoadingAI, setIsLoadingAI] = useState(false);
const [aiResponses, setAiResponses] = useState([]);
```

### API Integration
```javascript
const callOpenAIAPI = async (question, conversationContext) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a chemistry tutor with access to a chemistry textbook via RAG...`
        },
        {
          role: 'user',
          content: question
        }
      ]
    })
  });
};
```

### Context Generation
```javascript
const getConversationContext = (currentIndex, allConversations) => {
  const current = allConversations[currentIndex];
  const contextRange = 5;
  const startIndex = Math.max(0, currentIndex - contextRange);
  const contextMessages = allConversations.slice(startIndex, currentIndex + 1);
  
  return {
    currentSection: current?.sectionTitle || 'Unknown',
    currentSubsection: current?.subsectionTitle || 'Unknown',
    recentConversation: contextMessages.map(msg => `${msg.speaker}: ${msg.text}`).join('\n'),
    currentMessage: `${current?.speaker}: ${current?.text}`
  };
};
```

## UI Components

### Question Input Button
- Subtle green gradient button with hover effects
- Icon and text indicating "Ask a question about this topic"
- Smooth transitions and animations

### Question Input Modal
- Full-width text area with placeholder text
- Context indicator showing AI will receive conversation context
- Submit/Cancel buttons with loading states
- Character validation and disabled state handling

### AI Response Display
- User question displayed in blue gradient bubble (right-aligned)
- AI response in purple gradient bubble (left-aligned)
- Error responses in red gradient with error icon
- Proper spacing and typography hierarchy

## Error Handling
- **API Key Missing**: Clear error message with setup instructions
- **Network Errors**: Retry suggestions and connectivity hints
- **API Errors**: Status code and error message display
- **Rate Limiting**: Graceful degradation with user guidance

## Storage Schema
```javascript
// localStorage key: 'chemistry_course_ai_responses'
{
  id: timestamp,
  question: "user's question",
  answer: "AI response",
  contextIndex: currentMessageIndex,
  timestamp: "2024-01-01T00:00:00.000Z",
  sectionTitle: "Introduction to Chemistry",
  subsectionTitle: "What is Chemistry?",
  isError: false // true for error responses
}
```

## Usage Example
1. User navigates to any conversation message
2. Clicks "Ask a question about this topic" button
3. Types: "Can you explain why atoms bond together?"
4. System sends question + context to OpenAI API
5. AI responds with chemistry explanation using RAG knowledge
6. Response appears in conversation with question/answer styling
7. Data is automatically saved to localStorage

## Future Enhancements
- Voice input for questions
- Follow-up question suggestions
- Question history and search
- Export conversation with AI responses
- Collaborative questioning (multiple users)
- Advanced context filtering
- Custom AI model selection