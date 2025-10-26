# EROS Database Setup Guide

Complete guide for setting up the Supabase database for the EROS dating app.

## Prerequisites

- Supabase account (free tier is fine for development)
- SQL Editor access in Supabase Dashboard
- The three SQL files from this repository:
  - `supabase/schema.sql` (main app schema)
  - `supabase/admin_schema.sql` (admin dashboard schema)
  - `supabase/storage.sql` (storage buckets and policies)

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Project Name**: eros-app
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (for development)
4. Click "Create new project"
5. Wait 2-3 minutes for project to initialize

### 2. Get Your API Credentials

1. In your Supabase project, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy and save these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhb...` (long string)
4. You'll need these for your `.env` file

### 3. Apply Main Schema

1. In Supabase Dashboard, click "SQL Editor" in sidebar
2. Click "New query"
3. Open `supabase/schema.sql` from this repository
4. Copy ALL contents (604 lines)
5. Paste into SQL Editor
6. Click "Run" or press `Cmd/Ctrl + Enter`
7. You should see "Success. No rows returned"

**What this creates:**
- `profiles` table (user profiles)
- `profile_photos` table (user photos)
- `albums` table (photo albums)
- `album_photos` table
- `tribes` table (Bear, Otter, Twink, etc.)
- `profile_tribes` junction table
- `saved_phrases` table (quick messages)
- `conversations` table (chat threads)
- `messages` table (chat messages)
- `taps` table (likes, favorites, woofs)
- `blocks` table
- `reports` table
- `profile_views` table (who viewed me)
- All necessary indexes
- Row Level Security (RLS) policies
- PostgreSQL functions for distance calculations

### 4. Apply Storage Configuration

1. Create new query in SQL Editor
2. Open `supabase/storage.sql`
3. Copy ALL contents (90 lines)
4. Paste and run
5. Confirm success

**What this creates:**
- Storage bucket: `profile-photos` (public)
- Storage bucket: `album-photos` (public)
- Storage bucket: `chat-media` (public)
- RLS policies for all buckets

### 5. Verify Storage Buckets

1. In Supabase Dashboard, click "Storage" in sidebar
2. You should see three buckets:
   - `profile-photos`
   - `album-photos`
   - `chat-media`
3. All should be set to "Public"

If buckets don't appear:
- Go to Storage → Click "New Bucket"
- Create each bucket manually
- Set "Public bucket" to ON
- Then rerun `storage.sql`

### 6. Apply Admin Schema (Optional but Recommended)

1. Create new query in SQL Editor
2. Open `supabase/admin_schema.sql`
3. Copy ALL contents (614 lines)
4. Paste and run
5. Confirm success

**What this creates:**
- `admin_users` table (admin accounts)
- `moderation_actions` table (audit log)
- `photo_moderation_queue` table
- `subscription_plans` table
- `user_subscriptions` table
- `payment_transactions` table
- `age_verification_requests` table
- `gdpr_requests` table
- `content_flags` table
- Helper functions: `ban_user()`, `unban_user()`
- Admin RLS policies

### 7. Create Your First Admin User

After applying admin schema:

1. First, create an auth user in Supabase:
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Click "Create user"
   - **Copy the user's ID** (looks like: `123e4567-e89b-12d3-a456-426614174000`)

2. In SQL Editor, run:
```sql
INSERT INTO admin_users (id, email, role, is_active)
VALUES (
  'paste-user-id-here',  -- Replace with actual user ID from step 1
  'admin@yourdomain.com',
  'super_admin',
  TRUE
);
```

3. You can now log in to the admin dashboard with these credentials

### 8. Verify Database Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return ~25 tables

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Should show RLS enabled on most tables

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Should show 3 buckets

-- Check default tribes exist
SELECT name FROM tribes ORDER BY display_order;

-- Should show: Bear, Otter, Twink, Daddy, Jock, Geek, etc.
```

## Common Issues and Solutions

### Issue: "Permission denied for schema public"

**Solution**: Your database user doesn't have permissions. This shouldn't happen on Supabase, but if it does:
```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### Issue: "Extension postgis does not exist"

**Solution**: Enable PostGIS extension:
1. Go to Database → Extensions
2. Search for "postgis"
3. Click "Enable"
4. Then rerun schema.sql

### Issue: "Column violates row-level security policy"

**Solution**: You're trying to access data without proper authentication. Make sure:
- You're logged in via Supabase auth
- The `auth.uid()` function returns your user ID
- RLS policies are set up correctly

### Issue: Storage buckets not working

**Solution**:
1. Go to Storage → Click bucket name
2. Click "Policies"
3. Ensure policies exist for SELECT, INSERT, UPDATE, DELETE
4. If missing, rerun `storage.sql`

### Issue: Duplicate key violations when reinserting tribes

**Solution**: The tribes are already inserted. Either:
- Delete and recreate: `DELETE FROM tribes;` then rerun insert
- Or use `ON CONFLICT DO NOTHING` (already in schema)

## Testing Your Database

### Test 1: Create a Test Profile

```sql
-- First create an auth user via Supabase Dashboard
-- Then insert profile:

INSERT INTO profiles (
  id,
  display_name,
  date_of_birth,
  bio,
  city,
  country
) VALUES (
  'your-auth-user-id',
  'Test User',
  '1990-01-01',
  'This is a test profile',
  'San Francisco',
  'USA'
);
```

### Test 2: Upload a Test Photo

Use the app or Supabase Storage UI to upload a photo.

### Test 3: Query Nearby Profiles

```sql
-- Test the get_nearby_profiles function
SELECT * FROM get_nearby_profiles(
  37.7749,  -- San Francisco latitude
  -122.4194, -- San Francisco longitude
  50,        -- 50km radius
  100        -- limit 100 results
);
```

## Environment Variables

After database setup, add these to your `.env`:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Admin Dashboard (separate .env.local file)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Next Steps

1. ✅ Database schemas applied
2. ✅ Storage buckets created
3. ✅ Admin user created
4. → Start the app: `npm start`
5. → Create your first user profile
6. → Test all features
7. → Deploy admin dashboard to Vercel

## Security Checklist

Before going to production:

- [ ] Verify all RLS policies are working
- [ ] Test that users can't access other users' private data
- [ ] Verify ban_user() function works
- [ ] Test storage bucket permissions
- [ ] Enable Supabase Point-in-Time Recovery (paid plan)
- [ ] Set up database backups
- [ ] Configure database connection pooling (if needed)
- [ ] Set up monitoring and alerts
- [ ] Review and audit all RLS policies

## Supabase Dashboard Quick Links

- **SQL Editor**: Database → SQL Editor
- **Table Editor**: Database → Tables
- **Auth Users**: Authentication → Users
- **Storage**: Storage → Buckets
- **Database Logs**: Database → Logs
- **API Docs**: Settings → API → Documentation

## Support

If you encounter issues:
1. Check Supabase logs: Database → Logs
2. Verify RLS policies: Database → Tables → [table name] → Policies
3. Check storage policies: Storage → [bucket] → Policies
4. Consult Supabase docs: https://supabase.com/docs

