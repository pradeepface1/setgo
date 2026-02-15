import 'package:dio/dio.dart';
import '../models/trip.dart';
import 'api_service.dart';

class TripService {
  final ApiService _apiService = ApiService();

  Future<List<Trip>> getAssignedTrips(String driverId) async {
    try {
      final response = await _apiService.client.get('/drivers/$driverId/trips');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Trip.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to load trips: $e');
    }
  }

  Future<void> acceptTrip(String tripId) async {
    await _apiService.client.patch('/trips/$tripId/accept');
  }

  Future<void> startTrip(String tripId, String otp) async {
    await _apiService.client.patch('/trips/$tripId/start', data: {'otp': otp});
  }

  Future<void> completeTrip(String tripId, Map<String, dynamic> data) async {
    // Handling FormData for file upload later if needed
    await _apiService.client.patch('/trips/$tripId/complete', data: data);
  }
}
