# Complete JSON Course Structure Guide

This guide explains how to create JSON course files for the interactive conversation-based learning application.

## Overview

The application uses JSON files to define educational courses with:
- Conversational learning format (Teacher-Learner dialogue)
- Interactive sidebar content (images, quizzes, videos)
- Hierarchical section/subsection organization
- Downloadable resources
- Multiple quiz formats
- Progress tracking

## Top-Level Structure

```json
{
  "courseTitle": "Course Name",
  "courseDescription": "Brief description of the course",
  "sections": [...],
  "metadata": {...},
  "config": {...},
  "resources": [...],
  "quizzes": {...}
}
```

## Required Top-Level Fields

### 1. courseTitle (string, required)
The main title displayed in the UI and used for PDF generation.

```json
"courseTitle": "Some Basic Concepts of Chemistry"
```

### 2. courseDescription (string, required)
Brief description of what the course covers.

```json
"courseDescription": "Understanding the fundamentals of chemistry including matter, atoms, and chemical calculations"
```

### 3. sections (array, required)
Array of section objects containing the main course content.

## Section Structure

Each section represents a major topic/chapter:

```json
{
  "id": 1,
  "title": "Section Title",
  "description": "What this section covers",
  "subsections": [...]
}
```

### Section Fields:
- **id** (number, required): Unique identifier for the section
- **title** (string, required): Section name displayed in navigation
- **description** (string, required): Brief explanation of section content
- **subsections** (array, required): Array of subsection objects

## Subsection Structure

Each subsection contains the actual conversations:

```json
{
  "id": 1,
  "title": "Subsection Title",
  "description": "Specific topic description",
  "conversations": [...]
}
```

### Subsection Fields:
- **id** (number, required): Unique identifier within the section
- **title** (string, required): Subsection name
- **description** (string, required): What this subsection teaches
- **conversations** (array, required): Array of conversation objects

## Conversation Structure

The core learning content in Teacher-Learner dialogue format:

```json
{
  "speaker": "Teacher",
  "audioUrl": "audio/teacher1.mp3",
  "text": "The actual dialogue text",
  "sidebarContent": [...]
}
```

### Conversation Fields:
- **speaker** (string, required): Either "Teacher" or "Learner"
- **text** (string, required): The dialogue content
- **audioUrl** (string, optional): Path to audio file for text-to-speech
- **sidebarContent** (array, optional): Interactive content for this message

## Sidebar Content Types

Sidebar content provides interactive elements alongside conversations.

### 1. Image Content

```json
{
  "type": "image",
  "src": "https://example.com/image.jpg",
  "alt": "Descriptive text for accessibility"
}
```

### 2. Video Content

```json
{
  "type": "video",
  "src": "https://youtube.com/embed/video_id",
  "title": "Video description"
}
```

### 3. Quiz Content

```json
{
  "type": "quiz",
  "question": "What is the question?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct"
}
```

#### Quiz Fields:
- **question** (string, required): The quiz question
- **options** (array, required): Array of answer choices
- **correctAnswer** (number, required): Index of correct option (0-based)
- **explanation** (string, required): Explanation shown after answering

## Metadata Structure

Provides information about the course:

```json
"metadata": {
  "version": "1.0",
  "lastUpdated": "2024-01-01",
  "totalSections": 10,
  "totalSubsections": 14,
  "totalConversations": 70
}
```

## Config Structure

Controls application behavior and text:

```json
"config": {
  "storagePrefix": "course_prefix",
  "courseTitle": "Course Title",
  "subjectName": "Subject",
  "notesTitle": "Study Notes",
  "notesSubtitle": "Take notes while learning",
  "notesPlaceholder": "Start typing your notes here...",
  "resourcesTitle": "Downloadable Resources",
  "resourcesSubtitle": "Additional materials and practice exercises"
}
```

### Config Fields:
- **storagePrefix** (string, required): Unique prefix for localStorage
- **courseTitle** (string, required): Course title (should match top-level)
- **subjectName** (string, required): Subject name for AI prompts
- **notesTitle** (string, optional): Title for notes section
- **notesSubtitle** (string, optional): Subtitle for notes section
- **notesPlaceholder** (string, optional): Placeholder text for notes
- **resourcesTitle** (string, optional): Title for resources section
- **resourcesSubtitle** (string, optional): Subtitle for resources section

## Resources Structure

Downloadable materials organized by section:

```json
"resources": [
  {
    "sectionId": 1,
    "sectionTitle": "Section Name",
    "resources": [
      {
        "id": 1,
        "type": "flashcards",
        "title": "Resource Title",
        "description": "What this resource contains",
        "fileSize": "2.1 MB",
        "format": "PDF",
        "downloadUrl": "#"
      }
    ]
  }
]
```

### Resource Types:
- **flashcards**: Study cards
- **worksheet**: Practice exercises
- **report**: Templates or reports
- **video**: Educational videos

## Quizzes Structure

Standalone quiz sections with multiple formats:

```json
"quizzes": {
  "chapterTitle": "Chapter Name",
  "totalQuestions": 25,
  "formats": {
    "multipleChoice": {...},
    "truefalse": {...},
    "fillblanks": {...},
    "shortanswer": {...}
  }
}
```

### Quiz Format Types:

#### 1. Multiple Choice
```json
"multipleChoice": {
  "title": "Multiple Choice Questions",
  "description": "Choose the best answer",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct",
      "difficulty": "easy",
      "section": "Section Name"
    }
  ]
}
```

#### 2. True/False
```json
"truefalse": {
  "title": "True/False Questions",
  "description": "Determine if statements are true or false",
  "questions": [
    {
      "id": 1,
      "question": "Statement to evaluate",
      "answer": true,
      "explanation": "Explanation of the answer",
      "difficulty": "easy",
      "section": "Section Name"
    }
  ]
}
```

#### 3. Fill in the Blanks
```json
"fillblanks": {
  "title": "Fill in the Blanks",
  "description": "Complete the sentences",
  "questions": [
    {
      "id": 1,
      "question": "The ______ is the correct term.",
      "answer": "answer",
      "explanation": "Why this is the answer",
      "difficulty": "medium",
      "section": "Section Name"
    }
  ]
}
```

#### 4. Short Answer
```json
"shortanswer": {
  "title": "Short Answer Questions",
  "description": "Provide brief answers",
  "questions": [
    {
      "id": 1,
      "question": "Explain the concept briefly.",
      "sampleAnswer": "A comprehensive sample answer",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "difficulty": "hard",
      "section": "Section Name"
    }
  ]
}
```

## How the Code Uses the JSON

### 1. Course Loading
```javascript
import courseDataJson from "../data/yourCourse.json";
const courseData = courseDataJson.sections;
const courseConfig = courseDataJson.config;
```

### 2. Navigation Generation
The code automatically generates the left sidebar navigation from sections and subsections.

### 3. Conversation Flow
Conversations are flattened into a single array for sequential navigation:
```javascript
const getAllConversations = () => {
  const conversations = [];
  courseData.forEach(section => {
    section.subsections.forEach(subsection => {
      subsection.conversations.forEach(conversation => {
        conversations.push({...conversation, sectionId, subsectionId});
      });
    });
  });
  return conversations;
};
```

### 4. Sidebar Content Rendering
The application groups sidebar content by type and renders appropriate components:
- Images: Displayed with modal popup
- Videos: Embedded iframe players
- Quizzes: Interactive quiz components with answer tracking

### 5. Progress Tracking
The application tracks:
- Messages viewed
- Sections visited
- Subsections visited
- Quiz attempts and correct answers

## Best Practices

### Content Guidelines
1. **Dialogue Flow**: Alternate between Teacher and Learner speakers naturally
2. **Chunk Size**: Keep individual messages concise (2-3 sentences)
3. **Interactive Elements**: Add quizzes every 3-5 messages to reinforce learning
4. **Visual Support**: Include relevant images to support complex concepts

### Technical Guidelines
1. **IDs**: Use sequential integers for section, subsection, and quiz IDs
2. **Images**: Use web-optimized formats (JPG, PNG, WebP)
3. **URLs**: Use absolute URLs for external resources
4. **File Sizes**: Keep resources under 5MB for better performance

### Validation Checklist
- [ ] All required fields present
- [ ] Section/subsection IDs are unique and sequential
- [ ] Quiz correctAnswer indices are valid (within options array bounds)
- [ ] All image URLs are accessible
- [ ] Audio URLs point to valid files
- [ ] Resource download URLs work
- [ ] JSON syntax is valid

## Example Minimal Course

```json
{
  "courseTitle": "Introduction to Programming",
  "courseDescription": "Basic programming concepts for beginners",
  "sections": [
    {
      "id": 1,
      "title": "What is Programming?",
      "description": "Understanding the basics of programming",
      "subsections": [
        {
          "id": 1,
          "title": "First Steps",
          "description": "Your first programming lesson",
          "conversations": [
            {
              "speaker": "Teacher",
              "text": "Welcome to programming! Let's start with a simple question: What do you think programming is?",
              "sidebarContent": null
            },
            {
              "speaker": "Learner", 
              "text": "Is it like giving instructions to a computer?",
              "sidebarContent": null
            },
            {
              "speaker": "Teacher",
              "text": "Exactly! Programming is the process of creating instructions that a computer can understand and execute.",
              "sidebarContent": [
                {
                  "type": "quiz",
                  "question": "What is programming?",
                  "options": ["Drawing pictures", "Writing instructions for computers", "Playing games", "Sending emails"],
                  "correctAnswer": 1,
                  "explanation": "Programming is the process of writing instructions that computers can understand and execute."
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2024-01-01",
    "totalSections": 1,
    "totalSubsections": 1,
    "totalConversations": 3
  },
  "config": {
    "storagePrefix": "programming_course",
    "courseTitle": "Introduction to Programming", 
    "subjectName": "Programming",
    "notesTitle": "Study Notes",
    "notesSubtitle": "Take notes while learning",
    "notesPlaceholder": "Start typing your notes here...",
    "resourcesTitle": "Downloadable Resources",
    "resourcesSubtitle": "Additional materials and practice exercises"
  },
  "resources": [],
  "quizzes": {
    "chapterTitle": "Introduction to Programming",
    "totalQuestions": 1,
    "formats": {
      "multipleChoice": {
        "title": "Multiple Choice Questions",
        "description": "Choose the best answer",
        "questions": []
      }
    }
  }
}
```

This guide provides everything needed to create compatible JSON course files for the interactive learning application.