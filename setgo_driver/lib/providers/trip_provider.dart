import 'package:flutter/foundation.dart';
import '../models/trip.dart';
import '../services/trip_service.dart';

class TripProvider with ChangeNotifier {
  final TripService _tripService = TripService();
  
  List<Trip> _trips = [];
  List<Trip> _history = [];
  bool _isLoading = false;
  String? _error;

  List<Trip> get trips => _trips;
  List<Trip> get history => _history;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchAssignedTrips(String driverId) async {
    print("TripProvider: Fetching assigned trips for $driverId");
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _trips = await _tripService.getAssignedTrips(driverId);
      print("TripProvider: Fetched ${_trips.length} trips");
    } catch (e) {
      print("TripProvider: Error fetching trips: $e");
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchHistory(String driverId) async {
    print("TripProvider: Fetching history for $driverId");
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _history = await _tripService.getTripHistory(driverId);
      print("TripProvider: Fetched ${_history.length} history items");
    } catch (e) {
      print("TripProvider: Error fetching history: $e");
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

  Future<void> startTrip(String tripId, String driverId) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _tripService.startTrip(tripId);
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
