import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;
  Timer? _idleTimer;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  final AuthService _authService = AuthService();

  Future<void> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _authService.login(username, password);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _idleTimer?.cancel();
    notifyListeners();
  }

  void resetIdleTimer() {
    _idleTimer?.cancel();
    if (_user != null) {
      _idleTimer = Timer(const Duration(minutes: 1), () {
        logout();
      });
    }
  }

  Future<void> checkLoginStatus() async {
    final storedUser = await _authService.getStoredUser();
    if (storedUser != null) {
      _user = storedUser;
      notifyListeners();
    }
  }
}
