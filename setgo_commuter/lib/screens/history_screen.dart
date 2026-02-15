import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/trip_provider.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TripProvider>(context, listen: false).fetchMyTrips();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Trip History")),
      body: Consumer<TripProvider>(
        builder: (context, tripProvider, _) {
          if (tripProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          // Show all trips requested by user (History)
          final history = tripProvider.trips;

          return RefreshIndicator(
            onRefresh: () async {
              await Provider.of<TripProvider>(context, listen: false).fetchMyTrips();
            },
            child: history.isEmpty
                ? ListView( // Use ListView even for empty state to allow pull-to-refresh
                    children: const [
                      SizedBox(height: 300),
                      Center(child: Text("No trip history found.")),
                    ],
                  )
                : ListView.builder(
                    itemCount: history.length,
                    itemBuilder: (context, index) {
                      final trip = history[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(DateFormat('MMM dd, hh:mm a').format(trip.tripDateTime), style: const TextStyle(fontWeight: FontWeight.bold)),
                                  Text(trip.status, style: TextStyle(fontWeight: FontWeight.bold, color: _getStatusColor(trip.status))),
                                ],
                              ),
                              const Divider(),
                              _buildRow(Icons.my_location, "Pickup", trip.pickupLocation),
                              const SizedBox(height: 4),
                              _buildRow(Icons.location_on, "Drop", trip.dropLocation),
                              
                              if (trip.driver != null) ...[
                                const Divider(),
                                const Text("Driver Details:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(height: 4),
                                _buildRow(Icons.person, "Name", trip.driver!['name'] ?? 'N/A'),
                                _buildRow(Icons.directions_car, "Vehicle", trip.driver!['vehicleNumber'] ?? 'N/A'),
                                _buildRow(Icons.phone, "Mobile", trip.driver!['phone'] ?? 'N/A'),
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

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED': return Colors.green;
      case 'CANCELLED': return Colors.red;
      case 'STARTED': return Colors.blue;
      case 'ACCEPTED': return Colors.orange;
      default: return Colors.grey;
    }
  }

  Widget _buildRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Text("$label: ", style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
