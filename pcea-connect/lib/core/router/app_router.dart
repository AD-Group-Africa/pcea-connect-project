import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/feed/presentation/screens/feed_screen.dart';
import '../../features/livestream/presentation/screens/livestream_screen.dart';
import '../../features/media/presentation/screens/media_screen.dart';
import '../../features/bible/presentation/screens/bible_screen.dart';
import '../../features/prayer/presentation/screens/prayer_screen.dart';
import '../../features/events/presentation/screens/events_screen.dart';
import '../../features/giving/presentation/screens/giving_screen.dart';
import '../../features/ministries/presentation/screens/ministries_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/search/presentation/screens/search_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/feed', builder: (_, __) => const FeedScreen()),
    GoRoute(path: '/livestream', builder: (_, __) => const LivestreamScreen()),
    GoRoute(path: '/media', builder: (_, __) => const MediaScreen()),
    GoRoute(path: '/bible', builder: (_, __) => const BibleScreen()),
    GoRoute(path: '/prayer', builder: (_, __) => const PrayerScreen()),
    GoRoute(path: '/events', builder: (_, __) => const EventsScreen()),
    GoRoute(path: '/giving', builder: (_, __) => const GivingScreen()),
    GoRoute(path: '/ministries', builder: (_, __) => const MinistriesScreen()),
    GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
    GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
    GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
  ],
);
