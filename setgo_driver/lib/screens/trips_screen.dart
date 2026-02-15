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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
               final driver = Provider.of<AuthProvider>(context, listen: false).driver;
               if (driver != null) {
                 Provider.of<TripProvider>(context, listen: false).fetchAssignedTrips(driver.id);
               }
            },
          )
        ],
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
            return RefreshIndicator(
              onRefresh: () async {
                 final driver = Provider.of<AuthProvider>(context, listen: false).driver;
                 if (driver != null) {
                   await Provider.of<TripProvider>(context, listen: false).fetchAssignedTrips(driver.id);
                 }
              },
              child: ListView(
                children: const [
                  SizedBox(height: 100),
                  Center(child: Text('No assigned trips found.')),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
               final driver = Provider.of<AuthProvider>(context, listen: false).driver;
               if (driver != null) {
                 await Provider.of<TripProvider>(context, listen: false).fetchAssignedTrips(driver.id);
               }
            },
            child: ListView.builder(
              itemCount: tripProvider.trips.length,
              itemBuilder: (context, index) {
                final trip = tripProvider.trips[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 3,
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getStatusColor(trip.status),
                      child: const Icon(Icons.airport_shuttle, color: Colors.white),
                    ),
                    title: Text(
                      trip.dropLocation,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                         const SizedBox(height: 4),
                         if (trip.customerName != null)
                           Text("Customer: ${trip.customerName}", style: const TextStyle(fontWeight: FontWeight.w500)),
                         const SizedBox(height: 4),
                         Text("From: ${trip.pickupLocation}", maxLines: 1, overflow: TextOverflow.ellipsis),
                         const SizedBox(height: 4),
                         Text(
                          "${DateFormat('MMM dd, hh:mm a').format(trip.tripDateTime)}",
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                         Text(
                          "Status: ${trip.status}",
                          style: TextStyle(color: _getStatusColor(trip.status), fontWeight: FontWeight.bold),
                        ),
                      ],
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
            ),
          );
        },
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'ASSIGNED': return Colors.blue;
      case 'ACCEPTED': return Colors.orange;
      case 'STARTED': return Colors.green;
      case 'COMPLETED': return Colors.grey;
      case 'CANCELLED': return Colors.red;
      default: return Colors.blueGrey;
    }
  }
}
