# Public Assets Folder

This folder contains static assets that can be referenced in your JSON course data.

## Folder Structure

```
public/
├── images/
│   ├── chemistry/     # Chemistry-related images
│   ├── math/         # Mathematics-related images
│   └── general/      # General educational images
├── videos/           # Video files
├── documents/        # PDF, DOCX, and other documents
└── audio/           # Audio files and recordings
```

## How to Use Local Images in JSON

When referencing local images in your course JSON files, use relative paths from the public folder:

### Examples:

```json
{
  "type": "image",
  "src": "/images/chemistry/periodic-table.jpg",
  "alt": "Periodic Table of Elements"
}
```

```json
{
  "type": "image", 
  "src": "/images/math/algebra-graph.png",
  "alt": "Linear equation graph"
}
```

```json
{
  "type": "video",
  "src": "/videos/chemistry-lab-safety.mp4",
  "title": "Lab Safety Procedures"
}
```

### Audio Support for Conversations:

You can add audio narration to any conversation message:

```json
{
  "speaker": "Teacher",
  "text": "Welcome to Chemistry! Today we'll explore atoms.",
  "audioUrl": "/audio/teacher-chemistry-intro.mp3",
  "sidebarContent": [...]
}
```

Features:
- ✅ **Auto-play**: Audio plays automatically when message is in focus
- ✅ **Play/Pause controls**: Click button to control playback
- ✅ **Progress tracking**: Shows current time and duration
- ✅ **Auto-advance**: Option to automatically advance to next message

## File Naming Conventions

- Use lowercase letters
- Use hyphens (-) instead of spaces
- Be descriptive but concise
- Include subject prefix when helpful

### Good Examples:
- `atomic-structure-diagram.jpg`
- `linear-equations-example.png`
- `chemical-bonding-animation.gif`

### Avoid:
- `IMG_1234.jpg` (not descriptive)
- `My Chemistry Photo.png` (spaces and caps)
- `diagram.jpg` (too generic)

## Supported File Types

### Images:
- `.jpg`, `.jpeg` - Photos and complex images
- `.png` - Graphics with transparency
- `.gif` - Simple animations
- `.svg` - Vector graphics (scalable)
- `.webp` - Modern web format (smaller files)

### Videos:
- `.mp4` - Most compatible format
- `.webm` - Web-optimized format
- `.mov` - QuickTime format

### Documents:
- `.pdf` - Portable documents
- `.docx` - Word documents
- `.xlsx` - Excel spreadsheets
- `.pptx` - PowerPoint presentations

### Audio:
- `.mp3` - Compressed audio
- `.wav` - Uncompressed audio
- `.m4a` - Apple audio format

## Usage in Vite

Vite automatically serves files from the `public` folder at the root URL. Files placed here will be accessible at:

- `public/images/chemistry/atoms.jpg` → `/images/chemistry/atoms.jpg`
- `public/videos/lesson1.mp4` → `/videos/lesson1.mp4`
- `public/documents/worksheet.pdf` → `/documents/worksheet.pdf`

## Tips

1. **Optimize Images**: Use tools like TinyPNG to compress images before adding them
2. **Consistent Sizing**: Try to maintain consistent dimensions for similar types of images
3. **Alt Text**: Always provide descriptive alt text for accessibility
4. **File Size**: Keep images under 2MB when possible for faster loading
5. **Backup**: Keep original high-resolution versions in a separate backup folder