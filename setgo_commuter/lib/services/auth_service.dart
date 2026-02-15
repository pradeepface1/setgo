import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<User> login(String username, String password) async {
    try {
      final response = await _apiService.client.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final userData = response.data['user'];
        final user = User.fromJson(userData);
        
        final prefs = await SharedPreferences.getInstance();
        if (userData['token'] != null) {
          await prefs.setString('auth_token', userData['token']);
        }
        await prefs.setString('user_data', jsonEncode(user.toJson()));
        
        return user;
      } else {
        throw Exception(response.data['error'] ?? 'Login failed');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Login failed');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<User?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final String? userJson = prefs.getString('user_data');
    if (userJson != null) {
      return User.fromJson(jsonDecode(userJson));
    }
    return null;
  }
}
