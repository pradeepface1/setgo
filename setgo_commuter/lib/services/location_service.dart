import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../utils/constants.dart';

class LocationService {
  late IO.Socket _socket;
  final StreamController<Map<String, dynamic>> _driverLocationController = StreamController<Map<String, dynamic>>.broadcast();
  
  Stream<Map<String, dynamic>> get driverLocationStream => _driverLocationController.stream;

  final String userId;

  LocationService(this.userId);

  void init() {
    final String socketUrl = Constants.baseUrl.replaceAll('/api', '');
    _socket = IO.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    _socket.connect();

    _socket.onConnect((_) {
      print('Socket Connected');
      _socket.emit('identify', {'type': 'user', 'id': userId});
    });

    _socket.on('driverLocationUpdate', (data) {
      print('Received driver location: $data');
      _driverLocationController.add(data);
    });

    _socket.onDisconnect((_) => print('Socket Disconnected'));
  }

  void dispose() {
    _socket.disconnect();
    _driverLocationController.close();
  }
}
