// Navigation types for React Navigation

import { ProfileWithPhotos } from './database';

export type RootStackParamList = {
  // Auth flow
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  OnboardingProfile: undefined;

  // Main app
  MainTabs: undefined;

  // Modals and detail screens
  ProfileDetail: { profileId: string };
  EditProfile: undefined;
  Chat: { conversationId: string; otherUserId: string };
  Settings: undefined;
  Filters: undefined;
  BlockedUsers: undefined;
  AlbumDetail: { albumId: string };
  ReportUser: { userId: string };
  PremiumUpgrade: undefined;

  // Payment & Subscription screens
  Subscription: undefined;
  PaymentMethod: undefined;
  BillingHistory: undefined;
};

export type MainTabsParamList = {
  Explore: undefined;
  Favorites: undefined;
  Messages: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
