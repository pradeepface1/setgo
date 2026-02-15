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

  Future<List<Trip>> getTripHistory(String driverId) async {
    try {
      // Assuming backend supports query param or a separate endpoint.
      // For now, fetching all and filtering, or if backend has /history endpoint
      final response = await _apiService.client.get('/drivers/$driverId/history');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Trip.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      // Fallback: If history endpoint doesn't exist, we might need to rely on local filtering or main list
      print("History fetch error: $e");
      return [];
    }
  }

  Future<void> acceptTrip(String tripId) async {
    await _apiService.client.patch('/trips/$tripId/accept');
  }

  Future<void> startTrip(String tripId) async {
    await _apiService.client.patch('/trips/$tripId/start');
  }

  Future<void> completeTrip(String tripId, Map<String, dynamic> data) async {
    // Handling FormData for file upload later if needed
    await _apiService.client.patch('/trips/$tripId/complete', data: data);
  }
}
