import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/trip_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

import 'dart:async';

void main() {
  runZonedGuarded(() {
    WidgetsFlutterBinding.ensureInitialized();
    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.dumpErrorToConsole(details);
      runApp(ErrorApp(error: details.exception.toString(), stackTrace: details.stack.toString()));
    };
    runApp(const MyApp());
  }, (Object error, StackTrace stack) {
    runApp(ErrorApp(error: error.toString(), stackTrace: stack.toString()));
  });
}

class ErrorApp extends StatelessWidget {
  final String error;
  final String stackTrace;

  const ErrorApp({super.key, required this.error, required this.stackTrace});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        backgroundColor: Colors.red,
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 50),
              const Text("⚠️ APP CRASHED ⚠️", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              const Text("Please take a screenshot of this error:", style: TextStyle(color: Colors.white70)),
              const SizedBox(height: 10),
              SelectableText(
                "ERROR: $error",
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              const Text("STACK TRACE:", style: TextStyle(color: Colors.white70)),
              SelectableText(
                stackTrace,
                style: const TextStyle(color: Colors.white, fontSize: 10),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkLoginStatus()),
        ChangeNotifierProvider(create: (_) => TripProvider()),
      ],
      child: MaterialApp(
        title: 'SetGo Commuter',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFff5e62)),
          useMaterial3: true,
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.isAuthenticated) {
          return const DashboardScreen();
        }
        return const LoginScreen();
      },
    );
  }
}
