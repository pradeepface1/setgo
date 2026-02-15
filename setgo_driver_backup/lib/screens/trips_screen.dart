import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/trip_provider.dart';
import 'trip_details_screen.dart';

class TripsScreen extends StatefulWidget {
  const TripsScreen({super.key});

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch trips when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final driver = Provider.of<AuthProvider>(context, listen: false).driver;
      if (driver != null) {
        Provider.of<TripProvider>(context, listen: false).fetchAssignedTrips(driver.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Trips'),
      ),
      body: Consumer<TripProvider>(
        builder: (context, tripProvider, _) {
          if (tripProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (tripProvider.error != null) {
            return Center(child: Text('Error: ${tripProvider.error}'));
          }

          if (tripProvider.trips.isEmpty) {
            return const Center(child: Text('No assigned trips found.'));
          }

          return ListView.builder(
            itemCount: tripProvider.trips.length,
            itemBuilder: (context, index) {
              final trip = tripProvider.trips[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  leading: const Icon(Icons.airport_shuttle),
                  title: Text("To: ${trip.dropLocation}"),
                  subtitle: Text(
                    "${DateFormat('MMM dd, hh:mm a').format(trip.tripDateTime)}\nStatus: ${trip.status}",
                  ),
                  isThreeLine: true,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => TripDetailsScreen(trip: trip),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
