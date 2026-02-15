import 'package:dio/dio.dart';
import '../models/trip.dart';
import 'api_service.dart';

class TripService {
  final ApiService _apiService = ApiService();

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
