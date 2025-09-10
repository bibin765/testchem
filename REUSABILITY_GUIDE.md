# Worksheet Template Reusability Guide

This conversation page template has been designed to be completely data-driven and reusable for any subject. All hardcoded content has been moved to the JSON configuration file.

## How to Use for Different Subjects

### 1. Create Your Course Data JSON

Follow the structure in `src/data/courseData.json`. The file contains:

```json
{
  "courseTitle": "Your Course Title",
  "courseDescription": "Course overview",
  "sections": [
    {
      "id": 1,
      "title": "Section Name",
      "description": "What this section covers",
      "subsections": [
        {
          "id": 1,
          "title": "Subsection Name", 
          "description": "Subsection details",
          "conversations": [
            {
              "speaker": "Teacher",
              "text": "Teacher dialogue",
              "sidebarContent": [
                {
                  "type": "image|video|quiz",
                  // Content specific properties
                }
              ]
            },
            {
              "speaker": "Learner",
              "text": "Student response",
              "sidebarContent": null
            }
          ]
        }
      ]
    }
  ],
  "config": {
    "storagePrefix": "unique_course_identifier",
    "courseTitle": "Display Title",
    "subjectName": "Subject Name",
    "notesTitle": "Notes Panel Title",
    "notesSubtitle": "Notes panel subtitle",
    "notesPlaceholder": "Placeholder text with tips...",
    "resourcesTitle": "Resources Panel Title",
    "resourcesSubtitle": "Resources description"
  },
  "resources": [
    {
      "sectionId": 1,
      "sectionTitle": "Section Name",
      "resources": [
        {
          "id": 1,
          "type": "worksheet|flashcards|video|simulation",
          "title": "Resource Title",
          "description": "Resource description",
          "fileSize": "File size",
          "format": "PDF|MP4|HTML|DOCX",
          "downloadUrl": "Download link"
        }
      ]
    }
  ]
}
```

### 2. Key Configuration Options

#### Storage Prefix
- `storagePrefix`: Creates unique localStorage keys for each course
- Example: `"chemistry_course"` becomes `chemistry_course_progress`, `chemistry_course_notes`, etc.
- **Must be unique** for each course to avoid data conflicts

#### Course Metadata
- `courseTitle`: Main title displayed in the app
- `subjectName`: Used in various UI elements
- `courseDescription`: Overview text

#### UI Customization
- `notesTitle`: Title of the notes panel
- `notesSubtitle`: Subtitle text
- `notesPlaceholder`: Placeholder text with helpful tips
- `resourcesTitle`: Title of resources panel
- `resourcesSubtitle`: Description text

### 3. Content Structure

#### Sections
- Main topics of your course
- Each has `id`, `title`, `description`
- Contains multiple subsections

#### Subsections  
- Subtopics within each section
- Contains the actual conversations
- Each has `id`, `title`, `description`

#### Conversations
- Individual messages between Teacher and Learner
- `speaker`: "Teacher" or "Learner"
- `text`: The message content
- `sidebarContent`: Array of multimedia content or `null`

#### Sidebar Content Types
1. **Images**
   ```json
   {
     "type": "image",
     "src": "image-url",
     "alt": "description"
   }
   ```

2. **Videos**
   ```json
   {
     "type": "video", 
     "src": "youtube-embed-url",
     "title": "video-title"
   }
   ```

3. **Quizzes**
   ```json
   {
     "type": "quiz",
     "question": "Question text?",
     "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
     "correctAnswer": 2,
     "explanation": "Why this answer is correct"
   }
   ```

### 4. Resources System

Define downloadable materials for each section:

```json
{
  "sectionId": 1,
  "sectionTitle": "Section Name",
  "resources": [
    {
      "id": 1,
      "type": "worksheet",
      "title": "Practice Worksheet",
      "description": "What this resource contains",
      "fileSize": "1.5 MB",
      "format": "PDF",
      "downloadUrl": "actual-download-link"
    }
  ]
}
```

Supported resource types:
- `worksheet`: Practice exercises
- `flashcards`: Study cards
- `video`: Educational videos
- `simulation`: Interactive content
- `report`: Templates or examples

### 5. Example: Math Course

See `src/data/mathCourseData.json` for a complete example of how to adapt this template for a mathematics course.

### 6. Implementation Steps

1. **Create your JSON file** following the structure
2. **Update the import** in `ConversationPage.jsx`:
   ```jsx
   import courseDataJson from "../data/yourCourseData.json";
   ```
3. **Test thoroughly** to ensure all content displays correctly
4. **Customize styling** if needed (colors, themes, etc.)

### 7. Features That Work Automatically

Once you provide the JSON data, these features work automatically:

- ✅ **Navigation tree** with sections/subsections
- ✅ **Conversation flow** with Teacher/Learner dialogue
- ✅ **Multimedia content** (images, videos, quizzes)
- ✅ **Progress tracking** with unique storage keys
- ✅ **Notes system** with PDF export
- ✅ **Resources panel** with downloadable materials
- ✅ **Statistics tracking** (messages viewed, quizzes attempted)
- ✅ **Responsive design** for mobile and desktop
- ✅ **3D background animations** that respond to content

### 8. Best Practices

#### Content Creation
- Keep conversations natural and engaging
- Mix Teacher explanations with Learner questions/responses
- Use multimedia strategically to reinforce concepts
- Include quizzes to test understanding

#### Data Organization
- Use logical section/subsection numbering
- Keep descriptions concise but informative
- Ensure download URLs work when resources are ready
- Test all quiz questions and answers

#### Technical Considerations
- Choose unique `storagePrefix` for each course
- Keep JSON file properly formatted (use validator)
- Optimize images and videos for web delivery
- Test on different devices and screen sizes

## Example Subjects This Template Works For

- **Sciences**: Chemistry, Physics, Biology
- **Mathematics**: Algebra, Geometry, Calculus
- **Languages**: Grammar, Vocabulary, Conversation
- **History**: Timeline-based learning, Events
- **Literature**: Text analysis, Character studies
- **Programming**: Concepts, Syntax, Examples
- **Any conversational learning content**

## Need Help?

This template is designed to be self-contained and reusable. Simply create your JSON file following the structure, and the React component handles everything else automatically!