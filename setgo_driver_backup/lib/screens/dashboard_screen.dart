import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'trips_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final Completer<GoogleMapController> _controller = Completer<GoogleMapController>();

  // Default location (Mumbai)
  static const CameraPosition _kGooglePlex = CameraPosition(
    target: LatLng(19.0760, 72.8777),
    zoom: 14.4746,
  );

  bool _isOnline = false;

  @override
  Widget build(BuildContext context) {
    final driver = Provider.of<AuthProvider>(context).driver;

    return Scaffold(
      appBar: AppBar(
        title: Text(driver?.name ?? 'Driver Dashboard'),
        actions: [
          Switch(
            value: _isOnline,
            onChanged: (value) {
              setState(() {
                _isOnline = value;
              });
              // TODO: Call API to update status
            },
            activeColor: Colors.green,
            activeTrackColor: Colors.greenAccent,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              Provider.of<AuthProvider>(context, listen: false).logout();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          GoogleMap(
            mapType: MapType.normal,
            initialCameraPosition: _kGooglePlex,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
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
              color: Colors.white.withOpacity(0.9),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _isOnline ? "You are ONLINE" : "You are OFFLINE",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: _isOnline ? Colors.green : Colors.red,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text("Vehicle: ${driver?.vehicleNumber ?? 'N/A'}"),
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
              accountName: Text(driver?.name ?? 'Driver'),
              accountEmail: Text(driver?.phone ?? ''),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  driver?.name[0] ?? 'D',
                  style: const TextStyle(fontSize: 24.0),
                ),
              ),
              decoration: const BoxDecoration(
                color: Color(0xFF667EEA),
              ),
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
                // Navigate to history
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }
}
