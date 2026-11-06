# Property Image Upload Setup

This document outlines the implementation of property image uploads to a dedicated `uploads/property-images/` folder.

## Changes Made

### 1. Backend Middleware

#### New Property Upload Middleware (`backend/middleware/propertyUpload.js`)
- Creates dedicated `uploads/property-images/` directory
- Configures multer for property image uploads
- Supports multiple image formats (PNG, JPEG, GIF, WebP)
- 10MB file size limit per image
- Maximum 10 images per property
- Generates unique filenames with timestamp and random suffix
- Filename format: `property-images-{timestamp}-{random}.{extension}`

#### New FormData Parser (`backend/middleware/parseFormData.js`)
- Parses FormData with nested object notation
- Converts `address[city]` to `address.city`
- Handles array notation like `amenities[0]`
- Converts string values to appropriate types (numbers, booleans)
- Filters out empty amenities

### 2. Backend Routes

#### Updated Property Routes (`backend/routes/properties.js`)
- Added `uploadPropertyImages` middleware for POST and PUT routes
- Added `parseFormData` middleware to handle FormData submissions
- Middleware order: `auth` → `uploadPropertyImages` → `parseFormData` → `validateProperty` → `controller`

### 3. Backend Controllers

#### Updated Property Controller (`backend/controllers/propertyController.js`)
- **createProperty**: Handles uploaded images and saves file paths to database
- **updateProperty**: Handles image updates when editing properties
- Images are stored with:
  - URL: `/uploads/property-images/{filename}`
  - Caption: Original filename
  - Primary flag: First image is primary
  - Order: Sequential ordering

### 4. Frontend Components

#### Updated PropertyForm (`frontend/src/components/PropertyForm.js`)
- Modified `handleFormSubmit` to create FormData
- Properly appends all form fields including nested objects
- Handles image files from the `imageFiles` state
- Maintains backward compatibility with existing form structure

#### Updated PropertyFormPage (`frontend/src/pages/Properties/PropertyFormPage.js`)
- Modified `handleSubmit` to create FormData for backend submission
- Converts form data to proper FormData format
- Handles nested objects and arrays properly
- Sends FormData to Redux action

### 5. Directory Structure

```
backend/
├── uploads/
│   ├── profiles/          # User profile pictures
│   └── property-images/   # Property images (NEW)
│       └── README.md      # Documentation
```

## How It Works

### 1. Image Upload Flow
1. User selects images in PropertyForm
2. Images are stored in component state with preview URLs
3. On form submission, FormData is created with all form fields
4. Images are appended to FormData as `images` field
5. FormData is sent to backend via POST `/api/properties`

### 2. Backend Processing
1. `uploadPropertyImages` middleware saves files to `uploads/property-images/`
2. `parseFormData` middleware converts FormData to proper objects
3. `validateProperty` middleware validates the data
4. `createProperty` controller saves property with image URLs

### 3. Image Storage
- Physical files: `backend/uploads/property-images/`
- Database URLs: `/uploads/property-images/{filename}`
- Static serving: Express serves files from `/uploads` endpoint
- Access URLs: `http://localhost:5000/uploads/property-images/{filename}`

## File Naming Convention

Property images follow this naming pattern:
```
property-images-{timestamp}-{random}.{extension}
```

Example: `property-images-1756576844371-795800262.jpg`

## Supported Image Formats

- **PNG** (.png)
- **JPEG** (.jpg, .jpeg)
- **GIF** (.gif)
- **WebP** (.webp)

## Configuration

### File Size Limits
- Individual image: 10MB
- Total images per property: 10

### Directory Creation
The `property-images` directory is automatically created when the middleware is first used.

## Testing

To test the setup:

1. Start the backend server
2. Navigate to property creation form
3. Upload images
4. Check `backend/uploads/property-images/` for saved files
5. Verify images are accessible via `/uploads/property-images/{filename}`

## Troubleshooting

### Common Issues

1. **Images not saving**: Check if `uploads/property-images/` directory exists
2. **FormData parsing errors**: Verify middleware order in routes
3. **File size errors**: Check if images exceed 10MB limit
4. **CORS issues**: Ensure backend serves static files properly

### Debug Steps

1. Check server console for upload middleware logs
2. Verify FormData is being sent from frontend
3. Check if `req.files` contains uploaded images
4. Verify file paths are being saved to database

## Future Enhancements

- Image compression and optimization
- Thumbnail generation
- Image metadata extraction
- Cloud storage integration
- Image CDN support
