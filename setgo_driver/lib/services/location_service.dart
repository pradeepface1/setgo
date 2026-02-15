import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:geolocator/geolocator.dart';
import '../utils/constants.dart';

class LocationService {
  late IO.Socket _socket;
  final String driverId;
  final StreamController<Position> _locationStreamController = StreamController<Position>.broadcast();
  final StreamController<bool> _connectionStatusController = StreamController<bool>.broadcast();
  Timer? _locationTimer;

  LocationService(this.driverId);

  Stream<Position> get locationStream => _locationStreamController.stream;
  Stream<bool> get connectionStream => _connectionStatusController.stream;

  void init() {
    final String socketUrl = Constants.baseUrl.replaceAll('/api', '');
    print("LocationService: Connecting to socketUrl: $socketUrl");
    _socket = IO.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'forceNew': true,
    });
    _socket.connect();

    _socket.onConnect((_) {
      print('LocationService: Socket Connected');
      if (!_connectionStatusController.isClosed) {
        _connectionStatusController.add(true);
      }
      _socket.emit('identify', {'type': 'driver', 'id': driverId});
      // Force status update to ONLINE immediately
      sendStatus('ONLINE'); 
    });

    _socket.onConnectError((data) {
       print("LocationService: Socket Connect Error: $data");
       _connectionStatusController.add(false);
    });
    _socket.onError((data) {
       print("LocationService: Socket Error: $data");
       _connectionStatusController.add(false);
    });
    _socket.onDisconnect((_) {
       print('LocationService: Socket Disconnected');
       _connectionStatusController.add(false);
    });

    // Start tracking immediately for UI
    _startLocationUpdates();
  }

  void _startLocationUpdates() {
    // Initial position
    _determinePosition().then((position) {
       if (position != null) {
          _locationStreamController.add(position);
       }
    });

    _locationTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      final position = await _determinePosition();
      if (position != null) {
        // Always Emit to Local UI
        if (!_locationStreamController.isClosed) {
          _locationStreamController.add(position);
        }
        
        // Emit to Socket if connected
        print("LocationService: Socket connected: ${_socket.connected}");
        if (_socket.connected) {
          _socket.emit('locationUpdate', {
            'driverId': driverId,
            'lat': position.latitude,
            'lng': position.longitude,
            'status': 'ONLINE',
          });
        }
        
        print('Location emitted: ${position.latitude}, ${position.longitude}');
      }
    });
  }

  // New method to send status explicitly
  void sendStatus(String status) {
    if (_socket.connected) {
       _socket.emit('statusUpdate', {
        'driverId': driverId,
        'status': status
      });
    }
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
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return null;
    }

    return await Geolocator.getCurrentPosition();
  }

  void dispose() {
    _locationTimer?.cancel();
    _socket.disconnect();
    _locationStreamController.close();
  }
}
