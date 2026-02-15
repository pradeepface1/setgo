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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    leading: const Icon(Icons.history, color: Colors.grey),
                    title: Text(trip.dropLocation, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text(
                      "${DateFormat('MMM dd, hh:mm a').format(trip.tripDateTime)}\nStatus: ${trip.status}",
                    ),
                    isThreeLine: true,
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
