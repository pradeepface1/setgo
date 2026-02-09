import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Use localhost for iOS simulator, 10.0.2.2 for Android emulator
  // For physical device, use your machine's IP address
  static const String baseUrl = 'http://10.0.2.2:5001/api'; 

  // Driver login
  static Future<Map<String, dynamic>> loginDriver(String phone, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/driver/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'phone': phone,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Login failed');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> updateDriverStatus(String driverId, String status) async {
    // Implement actual API call later
    await Future.delayed(const Duration(milliseconds: 500));
    print('Driver status updated to: $status');
  }

  Future<List<dynamic>> getAssignedTrips(String driverId) async {
    // Mock implementation for MVP
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      {
        'id': '1',
        'customerName': 'John Doe',
        'pickupLocation': 'Airport Terminal 1',
        'dropLocation': 'Grand Hyatt Hotel',
        'tripDateTime': DateTime.now().add(const Duration(hours: 1)).toIso8601String(),
        'status': 'ASSIGNED'
      }
    ];
  }
}
