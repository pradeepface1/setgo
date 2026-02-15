import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/trip_provider.dart';
import '../services/location_service.dart';
import 'package:geolocator/geolocator.dart';
import 'trips_screen.dart';
import 'history_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final Completer<GoogleMapController> _controller = Completer<GoogleMapController>();
  LocationService? _locationService;
  Set<Circle> _circles = {};
  Timer? _dataTimer;

  // Default location (Mumbai)
  static const CameraPosition _kGooglePlex = CameraPosition(
    target: LatLng(19.0760, 72.8777),
    zoom: 14.4746,
  );

  bool _isOnline = false;

  @override
  void dispose() {
    _locationService?.dispose();
    super.dispose();
  }

  void _updateLocationMarker(LatLng position) {
    setState(() {
      _circles = {
        Circle(
          circleId: const CircleId("current_location_halo"),
          center: position,
          radius: 20,
          fillColor: Colors.blue.withOpacity(0.2),
          strokeWidth: 0,
          zIndex: 1,
        ),
        Circle(
          circleId: const CircleId("current_location_dot"),
          center: position,
          radius: 6,
          fillColor: Colors.blue,
          strokeColor: Colors.white,
          strokeWidth: 2,
          zIndex: 2,
        ),
      };
    });
  }

  @override
  void initState() {
    super.initState();
    // Auto-go online when dashboard loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initOnline();
    });
  }

  void _initOnline() {
    final driver = Provider.of<AuthProvider>(context, listen: false).driver;
    print("Dashboard: _initOnline called. Driver: ${driver?.name}, ID: ${driver?.id}");
    
    if (driver == null) {
       print("Dashboard: Driver is null. Cannot go online.");
       return;
    }
    
    if (_isOnline) {
       print("Dashboard: Already online. Skipping init.");
       return; 
    }

    setState(() {
      _isOnline = true;
    });

    print("Dashboard: Driver is ONLINE (Auto-init)");
    
    
    _locationService = LocationService(driver.id);
    _locationService!.init();
    
    // Initial Data Fetch
    print("Dashboard: Triggering initial data fetch");
    final tripProvider = Provider.of<TripProvider>(context, listen: false);
    tripProvider.fetchAssignedTrips(driver.id);
    tripProvider.fetchHistory(driver.id);

    // Start Data Polling
    _dataTimer?.cancel();
    print("Dashboard: Starting data polling timer (30s)");
    _dataTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      print("Dashboard: Polling timer fired. Fetching fresh data...");
      tripProvider.fetchAssignedTrips(driver.id);
      tripProvider.fetchHistory(driver.id);
    });
    
    // Listen to connection status
    _locationService!.connectionStream.listen((connected) {
      if (mounted) {
        setState(() {
          _isOnline = connected;
        });
      }
    });
    
    // Listen to location updates and center map
    _locationService!.locationStream.listen((event) async {
      final latLng = LatLng(event.latitude, event.longitude);
      
      // Update Marker
      _updateLocationMarker(latLng);

      if (!_controller.isCompleted) return;
      final GoogleMapController controller = await _controller.future;
      controller.animateCamera(CameraUpdate.newCameraPosition(
        CameraPosition(
          target: latLng,
          zoom: 17.0,
        ),
      ));
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Tracking started. Connecting to server...")),
    );
  }

  @override
  Widget build(BuildContext context) {
    final driver = Provider.of<AuthProvider>(context).driver;

    return Scaffold(
      appBar: AppBar(
        title: Text(driver?.name ?? 'Driver Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
               // Cleanup before logout
               _dataTimer?.cancel();
               _locationService?.sendStatus('OFFLINE');
               // small delay to ensure message sends
               await Future.delayed(const Duration(milliseconds: 500));
               _locationService?.dispose();
               if (context.mounted) {
                 Provider.of<AuthProvider>(context, listen: false).logout();
               }
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          GoogleMap(
            mapType: MapType.normal,
            initialCameraPosition: _kGooglePlex,
            myLocationEnabled: false,
            myLocationButtonEnabled: false,
            circles: _circles,
            onMapCreated: (GoogleMapController controller) {
              _controller.complete(controller);
            },
          ),
          // Container(color: Colors.grey[200], child: const Center(child: Text("Map Disabled for Debugging"))),
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Card(
              color: Colors.white.withOpacity(0.95),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                       mainAxisAlignment: MainAxisAlignment.center,
                       children: [
                          Icon(Icons.circle, color: _isOnline ? Colors.green : Colors.red, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            _isOnline ? "ONLINE" : "OFFLINE",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: _isOnline ? Colors.green : Colors.red,
                            ),
                          ),
                       ],
                    ),
                    const SizedBox(height: 8),
                    Text("Vehicle: ${driver?.vehicleNumber ?? 'N/A'}"),
                      if (!_isOnline)
                        Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: ElevatedButton(
                           onPressed: () {
                              _initOnline();
                           },
                           style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                           child: const Text("Retry Connection"),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                color: Color(0xFF1E3A8A), // Dark Blue to match SetGo theme
              ),
              accountName: Row(
                children: [
                   Image.asset('assets/logo.png', height: 32, fit: BoxFit.contain),
                   const SizedBox(width: 8),
                   const Text(
                    "Driver",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                   ),
                ],
              ),
              accountEmail: Text(driver?.phone ?? ''),
            ),
            ListTile(
              leading: const Icon(Icons.map),
              title: const Text('Map'),
              onTap: () {
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.list),
              title: const Text('My Trips'),
              onTap: () {
                Navigator.pop(context); // Close drawer
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const TripsScreen()),
                );
              },
            ),
             ListTile(
              leading: const Icon(Icons.history),
              title: const Text('History'),
              onTap: () {
                Navigator.pop(context); // Close drawer
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const HistoryScreen()),
                );
              },
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
            try {
              final position = await Geolocator.getCurrentPosition();
              _updateLocationMarker(LatLng(position.latitude, position.longitude));
              
              if (!_controller.isCompleted) return;
              final GoogleMapController controller = await _controller.future;
              controller.animateCamera(CameraUpdate.newCameraPosition(
                CameraPosition(
                  target: LatLng(position.latitude, position.longitude),
                  zoom: 17.0,
                ),
              ));
            } catch (e) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error locating: $e")));
            }
        },
        backgroundColor: Colors.blue,
        child: const Icon(Icons.my_location, color: Colors.white),
      ),
    );
  }
}
