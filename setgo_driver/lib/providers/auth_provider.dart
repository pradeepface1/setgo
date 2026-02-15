import 'package:flutter/foundation.dart';
import '../models/driver.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  Driver? _driver;
  bool _isLoading = false;
  String? _error;

  Driver? get driver => _driver;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _driver != null;

  final AuthService _authService = AuthService();

  Future<void> login(String phone, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _driver = await _authService.login(phone, password);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _driver = null;
    notifyListeners();
  }

  Future<void> checkLoginStatus() async {
    final storedDriver = await _authService.getStoredDriver();
    if (storedDriver != null) {
      _driver = storedDriver;
      notifyListeners();
    }
  }
}
