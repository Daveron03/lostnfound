# Campus Lost & Found Portal

A real-time web application for managing lost and found items on campus, built with TypeScript, CSS Grid, and Firebase Firestore.

## Features

- **Real-time synchronization** - All users see the same data instantly
- **Cloud persistence** - Data syncs across all devices and browsers
- **Responsive design** - Works on mobile, tablet, and desktop
- **Image support** - Optional photo URLs with fallback placeholders
- **Modern UI** - Clean design with hover effects and smooth animations

## Setup Instructions

### 1. Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Firestore Database:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location close to your users
4. Get your Firebase config:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click "Web" icon to add a web app
   - Copy the `firebaseConfig` object

### 2. Update Firebase Configuration

Replace the placeholder config in `firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

### 3. Firestore Security Rules

In the Firebase Console, go to Firestore Database > Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to items collection for all users
    match /items/{document} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Note**: These rules allow anyone to read/write data. For production, implement proper authentication and security rules.

### 4. Run the Application

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to see your app!

## File Structure

```
├── index.html          # Main HTML structure
├── style.css           # Responsive CSS with CSS Grid
├── main.ts             # Main application logic
├── data.ts             # Firebase Firestore data layer
├── firebase.ts         # Firebase configuration
├── types.ts            # TypeScript interfaces
└── package.json        # Dependencies and scripts
```

## API Functions

### `data.ts` exports:

- **`onItems(callback)`** - Subscribe to real-time item updates
- **`addItem(data)`** - Add a new lost item to the database  
- **`markFound(id)`** - Mark an item as found

## Deployment

### Static Hosting (Recommended)

Deploy to any static hosting service:

- **Netlify**: Drag and drop the `dist` folder after running `npm run build`
- **Vercel**: Connect your GitHub repo for automatic deployments
- **GitHub Pages**: Upload build files to a `gh-pages` branch
- **Firebase Hosting**: Use `firebase deploy` after setting up Firebase CLI

### Build for Production

```bash
npm run build
```

This creates a `dist` folder with optimized files ready for deployment.

## Troubleshooting

### "Cannot find module 'firebase/app'"
Make sure Firebase is installed: `npm install firebase`

### Data not syncing
1. Check Firebase configuration in `firebase.ts`
2. Verify Firestore rules allow read/write access
3. Check browser console for error messages

### Items not appearing
1. Open browser developer tools
2. Check Console tab for errors
3. Verify Firestore collection is named "items"

## Future Enhancements

The code includes TODO comments for these features:
- Search and filtering
- Interactive map with Leaflet
- Push notifications
- User authentication

## License

MIT License - Feel free to use this for your campus or modify as needed!
