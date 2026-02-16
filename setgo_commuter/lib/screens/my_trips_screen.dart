import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/trip_provider.dart';
import '../models/trip.dart';

class MyTripsScreen extends StatefulWidget {
  const MyTripsScreen({super.key});

  @override
  State<MyTripsScreen> createState() => _MyTripsScreenState();
}

class _MyTripsScreenState extends State<MyTripsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TripProvider>(context, listen: false).fetchMyTrips();
    });
  }

  List<Trip> _getActiveTrips(List<Trip> allTrips) {
    return allTrips.where((trip) {
      return trip.status == 'PENDING' || 
             trip.status == 'ASSIGNED' || 
             trip.status == 'IN_PROGRESS';
    }).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'ASSIGNED':
        return Colors.blue;
      case 'IN_PROGRESS':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    if (status == 'IN_PROGRESS') return 'Started';
    return status;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Active Trips"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              Provider.of<TripProvider>(context, listen: false).fetchMyTrips();
            },
          ),
        ],
      ),
      body: Consumer<TripProvider>(
        builder: (context, tripProvider, _) {
          if (tripProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          // Filter for active trips only
          final activeTrips = _getActiveTrips(tripProvider.trips);

          return RefreshIndicator(
            onRefresh: () async {
              await Provider.of<TripProvider>(context, listen: false).fetchMyTrips();
            },
            child: activeTrips.isEmpty
                ? ListView(
                    children: const [
                      SizedBox(height: 200),
                      Icon(Icons.directions_car, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Center(
                        child: Text(
                          "No active trips",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ),
                      SizedBox(height: 8),
                      Center(
                        child: Text(
                          "You don't have any ongoing trips at the moment.",
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: activeTrips.length,
                    itemBuilder: (context, index) {
                      final trip = activeTrips[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header with Trip # and Status
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    "Trip #${index + 1}",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(trip.status).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      _getStatusLabel(trip.status),
                                      style: TextStyle(
                                        color: _getStatusColor(trip.status),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                trip.customerName,
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                              const Divider(height: 24),
                              
                              // Pickup Location
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    margin: const EdgeInsets.only(top: 6),
                                    decoration: const BoxDecoration(
                                      color: Colors.green,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          "Pickup",
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey,
                                          ),
                                        ),
                                        Text(
                                          trip.pickupLocation,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              
                              // Drop Location
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    margin: const EdgeInsets.only(top: 6),
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          "Drop",
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey,
                                          ),
                                        ),
                                        Text(
                                          trip.dropLocation,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              
                              // Date & Time
                              Row(
                                children: [
                                  const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                                  const SizedBox(width: 8),
                                  Text(
                                    DateFormat('MMM dd, yyyy').format(trip.tripDateTime),
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                  const SizedBox(width: 16),
                                  const Icon(Icons.access_time, size: 16, color: Colors.grey),
                                  const SizedBox(width: 8),
                                  Text(
                                    DateFormat('hh:mm a').format(trip.tripDateTime),
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              
                              // Vehicle Category
                              Row(
                                children: [
                                  const Icon(Icons.directions_car, size: 16, color: Colors.grey),
                                  const SizedBox(width: 8),
                                  Text(
                                    trip.vehicleCategory,
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ],
                              ),
                              
                              // Driver Details (if assigned)
                              if (trip.driver != null) ...[
                                const Divider(height: 24),
                                const Text(
                                  "Assigned Driver",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Row(
                                        children: [
                                          const Icon(Icons.person, size: 16, color: Colors.grey),
                                          const SizedBox(width: 8),
                                          Flexible(
                                            child: Text(
                                              trip.driver!['name'] ?? 'N/A',
                                              style: const TextStyle(fontWeight: FontWeight.w500),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      child: Row(
                                        children: [
                                          const Icon(Icons.phone, size: 16, color: Colors.grey),
                                          const SizedBox(width: 8),
                                          Flexible(
                                            child: Text(
                                              trip.driver!['phone'] ?? 'N/A',
                                              style: const TextStyle(fontSize: 14),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.directions_car, size: 16, color: Colors.grey),
                                    const SizedBox(width: 8),
                                    Text(
                                      trip.driver!['vehicleNumber'] ?? 'N/A',
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ],
                                ),
                              ] else ...[
                                const Divider(height: 24),
                                const Text(
                                  "Driver not assigned yet",
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          );
        },
      ),
    );
  }
}
