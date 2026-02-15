import 'package:flutter/foundation.dart';
import '../models/trip.dart';
import '../services/trip_service.dart';

class TripProvider with ChangeNotifier {
  final TripService _tripService = TripService();
  
  List<Trip> _trips = [];
  bool _isLoading = false;
  String? _error;

  List<Trip> get trips => _trips;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Active trip is the latest trip if it's not completed/cancelled
  Trip? get activeTrip {
    if (_trips.isEmpty) return null;
    final latest = _trips.first; // Sorted by backend decending
    if (['PENDING', 'ASSIGNED', 'ACCEPTED', 'STARTED'].contains(latest.status)) {
      return latest;
    }
    return null;
  }

  Future<void> fetchMyTrips() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('TripProvider: Fetching my trips...');
      _trips = await _tripService.getMyTrips();
      print('TripProvider: Fetched ${_trips.length} trips: $_trips');
    } catch (e) {
      print('TripProvider: Error fetching trips: $e');
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> requestTrip(Map<String, dynamic> tripData) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _tripService.createTrip(tripData);
      await fetchMyTrips(); // Refresh list to show new active trip
    } catch (e) {
      _error = e.toString();
      throw e;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
