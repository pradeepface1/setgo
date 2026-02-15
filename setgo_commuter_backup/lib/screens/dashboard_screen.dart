import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/trip_provider.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final Completer<GoogleMapController> _controller = Completer<GoogleMapController>();

  static const CameraPosition _kGooglePlex = CameraPosition(
    target: LatLng(19.0760, 72.8777), // Default to Mumbai
    zoom: 14.4746,
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TripProvider>(context, listen: false).fetchMyTrips();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    return Scaffold(
      appBar: AppBar(
        title: Text('Hi, ${user?.username ?? 'Commuter'}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              Provider.of<TripProvider>(context, listen: false).fetchMyTrips();
            },
          ),
          IconButton(
            icon: const Icon(Icons.sos, color: Colors.red),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('SOS Alert Sent! (Simulation)')),
              );
            },
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
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Consumer<TripProvider>(
              builder: (context, tripProvider, _) {
                final trip = tripProvider.activeTrip;
                
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Active Trip", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                        const SizedBox(height: 8),
                        if (tripProvider.isLoading)
                          const Center(child: CircularProgressIndicator())
                        else if (trip != null) ...[
                          Text("Pickup: ${trip.pickupLocation}"),
                          Text("Drop: ${trip.dropLocation}"),
                          const SizedBox(height: 8),
                          Text("Status: ${trip.status}", style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text("Date: ${DateFormat('MMM dd, hh:mm a').format(trip.tripDateTime)}"),
                          if (trip.otp != null)
                             Text("OTP: ${trip.otp}", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 16)),
                        ] else
                          const Text("No active trip found."),
                        
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              // View History
                              // Navigator.push(...)
                            },
                            child: const Text('View Trip History'),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
