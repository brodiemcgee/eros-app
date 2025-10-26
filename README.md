# EROS Dating App

A modern, Hinge-inspired dating application built with React Native, Expo, and Supabase.

## Features

- **Location-Based Discovery**: Find nearby users with real-time distance tracking
- **Rich Profiles**: Comprehensive profile system with photos, bio, preferences
- **Real-Time Messaging**: Instant messaging with typing indicators
- **Tribes & Tags**: Community categorization (Bear, Otter, Twink, etc.)
- **Favorites System**: Save and organize your favorite profiles
- **Advanced Filters**: Filter by distance, age, preferences, and more
- **Premium Features**: "Who Viewed Me", unlimited favorites, enhanced visibility
- **Safety Features**: Block, report, and privacy controls
- **Photo Albums**: Public and private photo collections

## Tech Stack

- **Framework**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Navigation**: React Navigation v7
- **State Management**: React Context API
- **Styling**: Custom theme with purple/teal color scheme
- **Location**: Expo Location + PostGIS
- **Images**: Expo Image Picker + Supabase Storage

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli` or `npm install -g eas-cli`)
- Supabase account
- iOS Simulator (Mac only) or Android Emulator
- Stripe account (for payments)

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd eros-app
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key (optional)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

Get these values from:
- Supabase: https://supabase.com/dashboard → Your Project → Settings → API
- Stripe: https://dashboard.stripe.com/apikeys

### 3. Set Up Supabase Database

Run these SQL files in your Supabase SQL Editor (in order):

1. **Main Schema** (`supabase/schema.sql`):
   - Navigate to Supabase Dashboard → SQL Editor
   - Create new query
   - Paste contents of `schema.sql`
   - Run query

2. **Storage Configuration** (`supabase/storage.sql`):
   - Create new query
   - Paste contents of `storage.sql`
   - Run query

3. **Admin Schema** (optional, for admin dashboard):
   - Paste contents of `admin_schema.sql`
   - Run query

4. **Create Storage Buckets**:
   - Go to Storage → Create bucket
   - Create buckets: `profile-photos`, `album-photos`, `chat-media`
   - All buckets should be **public**

### 4. Update app.json

Edit `app.json` and update:
- `expo.owner`: Your Expo username
- `expo.extra.eas.projectId`: Your EAS project ID (get from `eas init`)
- iOS `bundleIdentifier`
- Android `package`

## Development

### Start Development Server

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

### Run on Specific Platform

```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## Building for Production

### Set Up EAS (Expo Application Services)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas init

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Create production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

### TestFlight (iOS)

```bash
# Build for App Store
eas build --profile production --platform ios

# Submit to TestFlight
eas submit --platform ios
```

### Google Play (Android)

```bash
# Build for Play Store
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android
```

### Web Deployment

```bash
# Build for web
npm run build:web

# Deploy to Vercel
vercel

# Or deploy the dist/ folder to any static hosting
```

## Project Structure

```
eros-app/
├── src/
│   ├── components/          # Reusable components
│   │   ├── PhotoGallery.tsx
│   │   ├── ProfileCompletionBanner.tsx
│   │   ├── SavedPhrasesPicker.tsx
│   │   └── TribeSelector.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── navigation/          # Navigation setup
│   │   ├── MainTabNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── screens/             # All app screens (17 total)
│   │   ├── ExploreScreen.tsx
│   │   ├── MessagesScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── EditProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── SubscriptionScreen.tsx    # Premium upgrades
│   │   ├── PaymentMethodScreen.tsx   # Payment management
│   │   └── ...
│   ├── services/            # API services
│   │   ├── supabase.ts
│   │   ├── profiles.ts
│   │   ├── messaging.ts
│   │   ├── location.ts
│   │   ├── imageUpload.ts
│   │   ├── savedPhrases.ts
│   │   └── stripe.ts
│   ├── types/               # TypeScript types
│   │   ├── database.ts
│   │   └── navigation.ts
│   ├── utils/               # Utility functions
│   │   ├── theme.ts
│   │   └── helpers.ts
│   └── config/
│       └── env.ts
├── supabase/                # Database schemas
│   ├── schema.sql
│   ├── admin_schema.sql
│   └── storage.sql
├── assets/                  # Images, icons, fonts
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── eas.json                 # EAS Build configuration
└── package.json

```

## Database Schema

The app uses a comprehensive Supabase (PostgreSQL) database with:

- **profiles**: User profiles with location, preferences, health info
- **profile_photos**: Multi-photo support with primary photo
- **albums**: Public and private photo collections
- **tribes**: Community tags (Bear, Otter, Twink, Daddy, etc.)
- **messages**: Real-time messaging system
- **conversations**: Chat threads
- **taps**: Like/interest system (viewed, waved, woofed, favorited)
- **blocks**: User blocking
- **reports**: User reporting
- **saved_phrases**: Quick response templates
- **profile_views**: Track who viewed your profile (premium)

All tables include Row Level Security (RLS) policies for data protection.

## Features by Screen

### Explore Screen
- Grid/cascade view modes
- Distance-based filtering
- Filter by "Fresh Faces", "Online", or "All"
- Pull to refresh
- Tap to view full profile

### Messages Screen
- Real-time conversation list
- Unread indicators
- Last message preview
- Navigate to individual chats

### Chat Screen
- Real-time messaging
- Typing indicators
- Photo sharing
- Message timestamps
- Saved phrases picker

### Profile Screen
- View own profile
- Edit profile button
- Settings access
- Sign out

### Edit Profile Screen
- Upload/manage photos
- Edit bio, stats, preferences
- Select tribes
- Privacy settings
- Location settings

### Settings Screen
- Account settings
- Privacy controls
- Notification preferences
- Distance unit toggle
- Premium upgrade
- Blocked users
- Delete account

### Subscription Screen (New)
- View all premium plans
- Purchase premium subscription
- Manage existing subscription
- Premium features list

## Premium Features

- **Who Viewed Me**: See who checked out your profile
- **Unlimited Favorites**: Save as many favorites as you want
- **Advanced Filters**: More granular search options
- **No Ads**: Ad-free experience
- **Read Receipts**: See when messages are read
- **Priority Support**: Faster customer service

## Security & Privacy

- Row Level Security (RLS) on all tables
- User data encrypted at rest
- HTTPS-only communication
- Report and block functionality
- Age verification system
- Content moderation queue
- GDPR compliance tools

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
# Clear cache
expo start -c

# Clear node modules
rm -rf node_modules
npm install

# Clear Expo cache
expo cache:clear
```

### Supabase Connection Issues

1. Verify environment variables are correct
2. Check Supabase project status
3. Verify RLS policies aren't blocking requests
4. Check network connectivity

### Location Not Working

- Ensure location permissions are granted
- Check `Info.plist` for iOS location strings
- Verify AndroidManifest.xml permissions for Android

## Testing

```bash
# Run type checking
npx tsc --noEmit

# Test web build
npm run build:web

# Preview web build locally
npx serve dist
```

## Deployment Checklist

Before going to production:

- [ ] All environment variables configured
- [ ] Database schemas applied to Supabase
- [ ] Storage buckets created and configured
- [ ] Stripe integration tested (test mode)
- [ ] All RLS policies verified
- [ ] iOS/Android app icons added
- [ ] Splash screen configured
- [ ] Privacy policy and terms of service added
- [ ] App store listings prepared
- [ ] TestFlight/Internal testing completed
- [ ] Switch Stripe to live mode
- [ ] Enable production analytics
- [ ] Set up error tracking (Sentry)
- [ ] Configure push notifications

## Support

For issues or questions:
- GitHub Issues: [Repository URL]
- Email: support@erosapp.com
- Documentation: [Docs URL]

## License

Proprietary - All rights reserved
