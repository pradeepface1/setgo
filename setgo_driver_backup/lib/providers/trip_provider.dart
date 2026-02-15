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

  Future<void> fetchAssignedTrips(String driverId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _trips = await _tripService.getAssignedTrips(driverId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> acceptTrip(String tripId, String driverId) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _tripService.acceptTrip(tripId);
      await fetchAssignedTrips(driverId); // Refresh list
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> startTrip(String tripId, String otp, String driverId) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _tripService.startTrip(tripId, otp);
      await fetchAssignedTrips(driverId); // Refresh list
    } catch (e) {
      _error = e.toString();
      throw e; // Rethrow to handle in UI
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> completeTrip(String tripId, Map<String, dynamic> data, String driverId) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _tripService.completeTrip(tripId, data);
      await fetchAssignedTrips(driverId); // Refresh list
    } catch (e) {
      _error = e.toString();
      throw e;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
