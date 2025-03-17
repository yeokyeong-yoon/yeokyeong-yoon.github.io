# Firebase Configuration Setup

This project uses Firebase for tracking page views and unique visitors. To set up Firebase for your own use, follow these steps:

## Setup Instructions

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup steps
   - Once created, go to Project Settings

2. **Add a Web App to Your Firebase Project**:
   - In Project Settings, click "Add App" and select the web platform
   - Register your app with a nickname (e.g., "My Blog")
   - Copy the Firebase configuration object

3. **Create the Firebase Configuration File**:
   - Copy `assets/js/firebase-config.template.js` to `assets/js/firebase-config.js`
   - Replace the placeholder values with your actual Firebase configuration

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890",
     measurementId: "G-ABCDEFGHIJ"
   };
   ```

4. **Set Up Firestore Database**:
   - In the Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Start in production mode
   - Choose a location close to your target audience

5. **Set Up Firestore Security Rules**:
   - In the Firestore Database section, go to the "Rules" tab
   - Update the rules to allow read/write access to your collections:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /pageViews/{document} {
         allow read, write: if true;
       }
       match /uniqueVisitors/{document} {
         allow read, write: if true;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

## Security Notes

- The `firebase-config.js` file is excluded from Git to prevent exposing your API key.
- For additional security, consider setting up domain restrictions in the Firebase Console to ensure your API key can only be used from your blog's domain.
- Monitor your Firebase usage to detect any unusual activity.

## Local Development

For local development, you'll need to:

1. Create the `assets/js/firebase-config.js` file with your Firebase configuration
2. This file will not be committed to Git due to the entry in `.gitignore`
3. Each developer will need to create their own copy of this file

## Deployment

When deploying to your hosting provider:

1. Make sure to include the `assets/js/firebase-config.js` file in your build process
2. Consider using environment variables or secrets management if your hosting provider supports it 