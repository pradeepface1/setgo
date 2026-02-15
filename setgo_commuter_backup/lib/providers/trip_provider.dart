import 'package:flutter/foundation.dart';
import '../models/trip.dart';
import '../services/trip_service.dart';

class TripProvider with ChangeNotifier {
  final TripService _tripService = TripService();
  
  List<Trip> _trips = [];
  bool _isLoading = false;
  String? _error;

  List<Trip> get trips => _trips;
  Trip? get activeTrip => _trips.isNotEmpty ? _trips.first : null; // Assuming first is active for simplicity
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchMyTrips() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _trips = await _tripService.getMyTrips();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
