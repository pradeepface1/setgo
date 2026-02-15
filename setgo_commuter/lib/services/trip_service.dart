import 'api_service.dart';
import '../models/trip.dart';

class TripService {
  final ApiService _apiService = ApiService();

  Future<Trip> createTrip(Map<String, dynamic> tripData) async {
    try {
      final response = await _apiService.client.post('/trips', data: tripData);
      return Trip.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to create trip: $e');
    }
  }

  Future<List<Trip>> getMyTrips() async {
    try {
      final response = await _apiService.client.get('/trips/my-trips');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Trip.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to load trips: $e');
    }
  }
}
