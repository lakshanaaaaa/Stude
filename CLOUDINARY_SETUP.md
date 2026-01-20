# Cloudinary Setup Guide

## Add to your `.env` file

Add these lines to your `.env` file (create it if it doesn't exist):

```env
CLOUDINARY_CLOUD_NAME=dqd4sllvd
CLOUDINARY_API_KEY=252136538182691
CLOUDINARY_API_SECRET=fXTcVlNF77fIA43VvMfb85OFpbw
```

## Features Implemented

### Profile Picture Upload
- **Students** can upload their profile pictures
- **Faculty** can upload their profile pictures
- Images are automatically:
  - Resized to 400x400 pixels
  - Cropped to focus on faces
  - Optimized for web delivery
  - Stored in Cloudinary with automatic format conversion

### How to Use

1. **For Students:**
   - Go to your profile page (`/student/:username`)
   - Hover over your avatar
   - Click the camera icon or "Upload Photo" button
   - Select an image file (max 5MB)
   - Your profile picture will be updated instantly

2. **For Faculty:**
   - Same process as students
   - Profile pictures appear in navigation bar and throughout the app

### Technical Details

- **Upload Endpoint:** `POST /api/upload/profile-picture`
- **File Size Limit:** 5MB
- **Accepted Formats:** All image formats (jpg, png, gif, webp, etc.)
- **Storage:** Cloudinary folder `codetrack/profile-pictures`
- **Naming:** Files are named `user_{userId}` for easy management

### Security

- Only authenticated users can upload
- Users can only upload their own profile pictures
- File type validation (images only)
- File size validation (5MB max)
- Automatic image optimization and sanitization by Cloudinary

## Restart Your Server

After adding the credentials to `.env`, restart your development server:

```bash
npm run dev
```

The profile picture upload feature will now be fully functional!
