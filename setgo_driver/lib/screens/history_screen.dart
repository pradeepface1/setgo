import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
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
      final driver = Provider.of<AuthProvider>(context, listen: false).driver;
      if (driver != null) {
        Provider.of<TripProvider>(context, listen: false).fetchHistory(driver.id);
      }
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

          if (tripProvider.history.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async {
                  final driver = Provider.of<AuthProvider>(context, listen: false).driver;
                  if (driver != null) {
                    await Provider.of<TripProvider>(context, listen: false).fetchHistory(driver.id);
                  }
              },
              child: ListView(
                children: const [
                  SizedBox(height: 100),
                  Center(child: Text("No trip history found.")),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
                final driver = Provider.of<AuthProvider>(context, listen: false).driver;
                if (driver != null) {
                  await Provider.of<TripProvider>(context, listen: false).fetchHistory(driver.id);
                }
            },
            child: ListView.builder(
              itemCount: tripProvider.history.length,
              itemBuilder: (context, index) {
                final trip = tripProvider.history[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header: Customer Name and Date
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    trip.customerName ?? 'Unknown Customer',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (trip.customerPhone != null) ...[
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(Icons.phone, size: 14, color: Colors.grey),
                                        const SizedBox(width: 4),
                                        Text(
                                          trip.customerPhone!,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            color: Colors.grey,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            Text(
                              DateFormat('MMM dd').format(trip.tripDateTime),
                              style: const TextStyle(
                                fontSize: 13,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: 4),
                        
                        // Status Badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: trip.status == 'COMPLETED' 
                                ? Colors.green.withOpacity(0.1)
                                : Colors.red.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            trip.status,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: trip.status == 'COMPLETED' 
                                  ? Colors.green.shade700
                                  : Colors.red.shade700,
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 12),
                        
                        // Route: Pickup to Drop
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Pickup
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Pickup',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    trip.pickupLocation,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  // Show flight/train/bus number if available
                                  if (trip.pickupContext != null) ...[
                                    const SizedBox(height: 2),
                                    if (trip.pickupContext!['flightNumber'] != null)
                                      Text(
                                        'Flight: ${trip.pickupContext!['flightNumber']}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    if (trip.pickupContext!['trainNumber'] != null)
                                      Text(
                                        'Train: ${trip.pickupContext!['trainNumber']}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    if (trip.pickupContext!['busNumber'] != null)
                                      Text(
                                        'Bus: ${trip.pickupContext!['busNumber']}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey,
                                        ),
                                      ),
                                  ],
                                ],
                              ),
                            ),
                            
                            // Arrow
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 16),
                              child: Icon(Icons.arrow_forward, size: 20, color: Colors.grey),
                            ),
                            
                            // Drop
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Drop',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    trip.dropLocation,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: 12),
                        
                        // Time
                        Row(
                          children: [
                            const Icon(Icons.access_time, size: 16, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text(
                              DateFormat('hh:mm a').format(trip.tripDateTime),
                              style: const TextStyle(
                                fontSize: 13,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
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
