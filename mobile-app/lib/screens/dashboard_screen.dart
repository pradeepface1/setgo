import 'package:flutter/material.dart';
import 'package:jubilant_mobile/services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic> driver;
  
  const DashboardScreen({super.key, required this.driver});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isOnline = false;
  final ApiService _apiService = ApiService();
  List<dynamic> _trips = [];

  @override
  void initState() {
    super.initState();
    // Set initial status based on driver data
    _isOnline = widget.driver['status'] == 'ONLINE';
    // Start polling for trips (simulated)
    _startPolling();
  }

  void _startPolling() async {
    while (mounted) {
      if (_isOnline) {
        // Fetch mock trips
        // In real app, this would be a socket listener or real API poll
        await Future.delayed(const Duration(seconds: 5));
        if (mounted && _trips.isEmpty) {
           final trips = await _apiService.getAssignedTrips(widget.driver['_id']);
           setState(() {
             _trips = trips;
           });
        }
      } else {
        await Future.delayed(const Duration(seconds: 1));
      }
    }
  }

  void _toggleStatus() {
    setState(() {
      _isOnline = !_isOnline;
      if (!_isOnline) _trips = []; // Clear trips when going offline
    });
    _apiService.updateDriverStatus(widget.driver['_id'], _isOnline ? 'ONLINE' : 'OFFLINE');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Hi, ${widget.driver['name']}'),
        actions: [
          Switch(
            value: _isOnline,
            onChanged: (val) => _toggleStatus(),
            activeColor: Colors.green,
            inactiveThumbColor: Colors.grey,
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: _isOnline
          ? _trips.isEmpty
              ? const Center(child: Text('Waiting for trips...', style: TextStyle(fontSize: 18, color: Colors.grey)))
              : ListView.builder(
                  itemCount: _trips.length,
                  itemBuilder: (context, index) {
                    final trip = _trips[index];
                    return Card(
                      margin: const EdgeInsets.all(16),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('New Trip Request', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.blue)),
                            const SizedBox(height: 8),
                            Text('Pickup: ${trip['pickupLocation']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                            Text('Drop: ${trip['dropLocation']}'),
                            Text('Time: ${trip['tripDateTime']}'),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () {
                                      setState(() {
                                        _trips.removeAt(index);
                                      });
                                    },
                                    child: const Text('Reject'),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      // Accept Logic
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Trip Accepted!')),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                                    child: const Text('Accept'),
                                  ),
                                ),
                              ],
                            )
                          ],
                        ),
                      ),
                    );
                  },
                )
          : const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.offline_bolt, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('You are OFFLINE', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey)),
                  Text('Go online to receive trips', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ),
    );
  }
}
