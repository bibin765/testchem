# Notes Feature Documentation

## Overview
The Notes feature allows users to take comprehensive notes while learning, with automatic saving and PDF export functionality. Notes are contextually linked to the current lesson topic and persist across sessions.

## Features
- 📝 **Rich Text Editor**: Full-featured textarea for writing detailed notes
- 💾 **Auto-Save**: Notes automatically save to localStorage as you type
- 📄 **PDF Export**: Download professionally formatted PDF with topic context
- ⌨️ **Keyboard Shortcuts**: Quick access with keyboard combinations
- 🔗 **Context Awareness**: Shows current section and subsection
- 📊 **Word Count**: Real-time word count display
- 🗑️ **Clear Function**: Safely clear all notes with confirmation

## Access Methods

### 1. Notes Icon Button
- Location: Top-right of screen (before Resources icon)
- Icon: Document/note icon
- Tooltip: "Toggle notes panel"

### 2. Keyboard Shortcuts
- **Ctrl/Cmd + Shift + N**: Toggle notes panel
- **Ctrl/Cmd + S**: Download PDF (when notes panel is open and has content)

## Notes Panel Layout

### Header Section
- Title: "Study Notes"
- Subtitle: "Take notes while learning"
- Close button (X)

### Editor Section
- Large textarea with placeholder text and tips
- Real-time word count
- Current topic display
- Auto-resize and scroll functionality

### Actions Section
- **Download PDF**: Export notes as professionally formatted PDF
- **Clear**: Remove all notes with confirmation dialog
- **Pro Tips**: Helpful usage suggestions

## PDF Export Features

### Document Structure
- **Title**: "Chemistry Course Notes"
- **Timestamp**: Generation date and time
- **Current Topic**: Section and subsection information
- **Notes Content**: User's notes with proper formatting
- **Page Numbers**: Professional footer with page numbering

### PDF Features
- Automatic page breaks
- Text wrapping and formatting
- Professional styling
- Unique filename with timestamp
- Multi-page support

### Example PDF Filename
```
chemistry-notes-20241201123045.pdf
```

## Technical Implementation

### State Management
```javascript
const [showNotesPanel, setShowNotesPanel] = useState(false);
const [userNotes, setUserNotes] = useState(() => 
  loadFromLocalStorage(STORAGE_KEYS.NOTES, '')
);
```

### Auto-Save Implementation
```javascript
useEffect(() => {
  saveToLocalStorage(STORAGE_KEYS.NOTES, userNotes);
}, [userNotes]);
```

### PDF Generation
```javascript
const downloadNotesAsPDF = async () => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  // ... PDF generation logic
};
```

### Keyboard Shortcuts
```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
      setShowNotesPanel(prev => !prev);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Storage Schema
```javascript
// localStorage key: 'chemistry_course_notes'
// Value: string (markdown-style text)
```

## Usage Examples

### Basic Note-Taking
1. Click notes icon or press Ctrl+Shift+N
2. Start typing in the text area
3. Notes automatically save as you type
4. Use Download PDF button to export

### Structured Learning Notes
```
# Introduction to Chemistry

## Key Concepts
- Matter: anything with mass and volume
- Atoms: basic building blocks
- Chemical bonds: how atoms connect

## Questions for Review
- Why do atoms bond?
- What are the different states of matter?

## Formulas to Remember
- Density = Mass / Volume
- PV = nRT (Ideal Gas Law)
```

### PDF Export Workflow
1. Take notes during lesson
2. Click "Download PDF" button
3. PDF automatically includes:
   - Current topic context
   - Timestamp
   - Formatted notes content
   - Professional styling

## UI/UX Features

### Visual Design
- Dark theme matching application
- Glass morphism effects
- Emerald accent colors
- Professional typography
- Responsive layout

### User Experience
- Smooth slide-in animation
- Non-blocking interface
- Clear visual hierarchy
- Intuitive controls
- Helpful placeholder text

### Accessibility
- Keyboard navigation support
- Clear focus indicators
- Proper ARIA labels
- High contrast text
- Logical tab order

## Integration Points

### Context Awareness
- Displays current section/subsection
- PDF includes topic information
- Notes tied to learning progress

### Panel Management
- Higher z-index than other panels
- Proper stacking order
- Non-interfering with other features

### Performance Optimizations
- Lazy loading of jsPDF library
- Efficient state updates
- Minimal re-renders
- Optimized event handlers

## Future Enhancements

### Potential Features
- Markdown rendering support
- Rich text formatting
- Image insertion
- Note templates
- Export to other formats (Word, text)
- Search within notes
- Automatic backup
- Cloud synchronization
- Collaborative notes
- Voice-to-text input

### Advanced PDF Features
- Custom styling options
- Multiple export formats
- Batch export
- Email sharing
- Print optimization

## Best Practices

### For Users
- Take notes actively during lessons
- Use clear headings and structure
- Review and expand notes after lessons
- Export PDF copies for offline study
- Use keyboard shortcuts for efficiency

### For Developers
- Keep notes state separate from lesson state
- Implement proper error handling for PDF generation
- Ensure cross-browser compatibility
- Test with various note lengths
- Maintain consistent styling

## Error Handling

### PDF Generation Errors
- Graceful fallback with user notification
- Console logging for debugging
- Retry mechanisms
- Clear error messages

### Storage Errors
- Handle localStorage quota exceeded
- Backup strategies
- Data validation
- Recovery mechanisms

## Browser Compatibility
- Modern browsers with ES6+ support
- localStorage availability required
- jsPDF library compatibility
- Print/download permissions