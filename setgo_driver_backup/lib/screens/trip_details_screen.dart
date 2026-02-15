import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/trip.dart';
import '../providers/trip_provider.dart';
import '../providers/auth_provider.dart';

class TripDetailsScreen extends StatefulWidget {
  final Trip trip;

  const TripDetailsScreen({super.key, required this.trip});

  @override
  State<TripDetailsScreen> createState() => _TripDetailsScreenState();
}

class _TripDetailsScreenState extends State<TripDetailsScreen> {
  final _otpController = TextEditingController();

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: Colors.red));
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: Colors.green));
  }

  @override
  Widget build(BuildContext context) {
    final driver = Provider.of<AuthProvider>(context, listen: false).driver!;
    final tripProvider = Provider.of<TripProvider>(context);

    // Get latest trip status from provider if updated, otherwise use passed trip
    // But since list rebuilds, we rely on provider methods updating the list and we pop back or refresh?
    // Actually, simple flow: Action -> wait -> success -> pop.
    
    return Scaffold(
      appBar: AppBar(title: const Text('Trip Details')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow("Pickup", widget.trip.pickupLocation),
            const SizedBox(height: 16),
            _buildDetailRow("Drop", widget.trip.dropLocation),
            const SizedBox(height: 16),
            _buildDetailRow("Status", widget.trip.status),
            const SizedBox(height: 32),
            
            // Action Buttons based on status
            if (widget.trip.status == 'ASSIGNED')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: tripProvider.isLoading ? null : () async {
                    try {
                      await tripProvider.acceptTrip(widget.trip.id, driver.id);
                      _showSuccess("Trip Accepted!");
                      if (mounted) Navigator.pop(context);
                    } catch (e) {
                      _showError("Failed to accept: $e");
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                  child: const Text('ACCEPT TRIP'),
                ),
              ),

            if (widget.trip.status == 'ACCEPTED') ...[
              TextField(
                controller: _otpController,
                decoration: const InputDecoration(
                  labelText: 'Enter OTP to Start',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: tripProvider.isLoading ? null : () async {
                    if (_otpController.text.isEmpty) {
                      _showError("Please enter OTP");
                      return;
                    }
                    try {
                      await tripProvider.startTrip(widget.trip.id, _otpController.text, driver.id);
                      _showSuccess("Trip Started!");
                      if (mounted) Navigator.pop(context);
                    } catch (e) {
                      _showError("Failed to start: $e");
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                  child: const Text('START TRIP'),
                ),
              ),
            ],

            if (widget.trip.status == 'STARTED')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: tripProvider.isLoading ? null : () async {
                    try {
                      // Optional: Add params for odometer updates etc.
                      await tripProvider.completeTrip(widget.trip.id, {}, driver.id);
                      _showSuccess("Trip Completed!");
                      if (mounted) Navigator.pop(context);
                    } catch (e) {
                      _showError("Failed to complete: $e");
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                  child: const Text('COMPLETE TRIP'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 16)),
      ],
    );
  }
}
