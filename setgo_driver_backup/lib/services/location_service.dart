import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:geolocator/geolocator.dart';
import '../utils/constants.dart';

class LocationService {
  late IO.Socket _socket;
  Timer? _locationTimer;
  final String driverId;

  LocationService(this.driverId);

  void init() {
    // Connect to Socket.IO (Base URL without /api)
    // Constants.baseUrl is 'http://10.0.2.2:5001/api', so we need 'http://10.0.2.2:5001'
    final String socketUrl = Constants.baseUrl.replaceAll('/api', '');

    _socket = IO.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    _socket.connect();

    _socket.onConnect((_) {
      print('Socket Connected');
      _socket.emit('identify', {'type': 'driver', 'id': driverId});
      _startLocationUpdates();
    });

    _socket.onDisconnect((_) => print('Socket Disconnected'));
  }

  void _startLocationUpdates() {
    // Update location every 10 seconds
    _locationTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      final position = await _determinePosition();
      if (position != null) {
        _socket.emit('locationUpdate', {
          'driverId': driverId,
          'lat': position.latitude,
          'lng': position.longitude,
          'status': 'ONLINE', // Should come from real status
        });
        print('Location emitted: ${position.latitude}, ${position.longitude}');
      }
    });
  }

  Future<Position?> _determinePosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return null;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return null; // Permission denied
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return null; // Permission permanently denied
    }

    return await Geolocator.getCurrentPosition();
  }

  void dispose() {
    _locationTimer?.cancel();
    _socket.disconnect();
    _socket.dispose();
  }
}
