# Blog Post View and Visitor Counters

This repository contains two implementations for adding view counts and visitor counts to your Jekyll blog posts:

1. **Firebase Implementation**: Uses Firebase Firestore to store and retrieve counts
2. **Simple Implementation**: Uses localStorage to store counts locally (for testing purposes)

## Setup Instructions

### Firebase Implementation (Recommended for Production)

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup steps
   - Once created, go to Project Settings

2. **Add a Web App to Your Firebase Project**:
   - In Project Settings, click "Add App" and select the web platform
   - Register your app with a nickname (e.g., "My Blog")
   - Copy the Firebase configuration object

3. **Update the Firebase Configuration**:
   - Open `assets/js/firebase-config.js`
   - Replace the placeholder configuration with your Firebase configuration

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
         allow read: if true;
         allow write: if true;
       }
       match /uniqueVisitors/{document} {
         allow read: if true;
         allow write: if true;
       }
     }
   }
   ```

   Note: For production, you might want to implement more restrictive security rules.

6. **Include the Scripts in Your Post Layout**:
   - The scripts are already included in `_layouts/post.html`
   - Make sure both `firebase-config.js` and `page-views.js` are included

### Simple Implementation (For Testing)

If you want to test the functionality locally without setting up Firebase:

1. **Replace the Firebase Scripts with the Simple Implementation**:
   - Open `_layouts/post.html`
   - Replace the Firebase scripts with:

   ```html
   <!-- Include the simple counter script -->
   <script src="{{ '/assets/js/simple-counter.js' | relative_url }}"></script>
   ```

2. **Remove Firebase SDK from Default Layout**:
   - Open `_layouts/default.html`
   - Remove or comment out the Firebase SDK scripts

## How It Works

### Firebase Implementation

- When a user visits a post, the script checks if they've visited before using localStorage
- For each new visit, the page view count is incremented in Firestore
- For first-time visitors to a specific post, the unique visitor count is also incremented
- The counts are displayed in the post metadata section

### Simple Implementation

- Uses localStorage to store view and visitor counts
- Counts are stored per page path
- This implementation is only for testing as the counts are stored locally in the browser
- Each browser/device will have its own separate counts

## Customization

### Styling

You can customize the appearance of the counters by modifying the CSS in `_layouts/post.html`:

```html
<span class="post-stats">
  <span class="views">조회수: <span id="page-views">0</span></span>
  • <span class="visitors">방문자 수: <span id="unique-visitors">0</span></span>
</span>
```

### Terminology

You can change the labels "조회수" (View Count) and "방문자 수" (Visitor Count) to any text you prefer.

## Troubleshooting

- **Counts Not Updating**: Check browser console for errors
- **Firebase Errors**: Verify your Firebase configuration and security rules
- **CORS Issues**: Ensure your Firebase project is properly configured for your domain

## Notes

- The Firebase implementation requires an internet connection to update counts
- The simple implementation only stores counts locally and will not persist across different browsers or devices
- For a production site, consider implementing more restrictive Firestore security rules 