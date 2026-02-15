import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../models/driver.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<Driver> login(String phone, String password) async {
    try {
      final response = await _apiService.client.post('/auth/driver/login', data: {
        'phone': phone,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final driverData = response.data['driver'];
        final driver = Driver.fromJson(driverData);
        
        // Save token and driver data
        final prefs = await SharedPreferences.getInstance();
        if (driver.token != null) {
          await prefs.setString('auth_token', driver.token!);
        }
        await prefs.setString('driver_data', jsonEncode(driver.toJson()));
        
        return driver;
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

  Future<Driver?> getStoredDriver() async {
    final prefs = await SharedPreferences.getInstance();
    final String? driverJson = prefs.getString('driver_data');
    if (driverJson != null) {
      return Driver.fromJson(jsonDecode(driverJson));
    }
    return null;
  }
}
