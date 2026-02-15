import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
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
  // final _otpController = TextEditingController(); // Removed


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

            // Customer Info
            if (widget.trip.customerName != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
                child: Row(
                  children: [
                    const Icon(Icons.person, color: Colors.blue),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(widget.trip.customerName!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          if (widget.trip.customerPhone != null)
                            InkWell(
                              onTap: () => launchUrl(Uri.parse("tel:${widget.trip.customerPhone}")),
                              child: Text(widget.trip.customerPhone!, style: const TextStyle(color: Colors.blue, decoration: TextDecoration.underline)),
                            ),
                        ],
                      ),
                    ),
                    if (widget.trip.customerPhone != null)
                      IconButton(
                        icon: const Icon(Icons.call, color: Colors.green),
                        onPressed: () => launchUrl(Uri.parse("tel:${widget.trip.customerPhone}")),
                      )
                  ],
                ),
              ),

            // Pickup Row with Badge & Navigate
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildDetailRow("Pickup", widget.trip.pickupLocation)),
                if (widget.trip.googleLocation != null && widget.trip.googleLocation!.isNotEmpty)
                   ElevatedButton.icon(
                     onPressed: () => launchUrl(Uri.parse(widget.trip.googleLocation!), mode: LaunchMode.externalApplication),
                     icon: const Icon(Icons.directions, size: 16),
                     label: const Text("Navigate"),
                     style: ElevatedButton.styleFrom(
                       padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                       textStyle: const TextStyle(fontSize: 12),
                     ),
                   ),
              ],
            ),
            
            // Pickup Type & Context
            if (widget.trip.pickupType != null && widget.trip.pickupType != 'OTHERS') ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(4)),
                child: Text(
                  widget.trip.pickupType!.replaceAll('_', ' '),
                  style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
            if (widget.trip.pickupContext != null && widget.trip.pickupContext!.isNotEmpty) ...[
               const SizedBox(height: 4),
               if (widget.trip.pickupContext!['flightNumber'] != null)
                 Text("✈️ Flight: ${widget.trip.pickupContext!['flightNumber']}", style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
               if (widget.trip.pickupContext!['trainNumber'] != null)
                 Text("🚆 Train: ${widget.trip.pickupContext!['trainNumber']}", style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
               if (widget.trip.pickupContext!['busNumber'] != null)
                 Text("🚌 Bus: ${widget.trip.pickupContext!['busNumber']}", style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
            ],

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
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: tripProvider.isLoading ? null : () async {
                    // Confirmation Dialog for safety
                    bool? confirm = await showDialog(
                      context: context, 
                      builder: (ctx) => AlertDialog(
                        title: const Text("Start Trip?"),
                        content: const Text("Are you sure you want to start this trip now?"),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("No")),
                          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("Yes")),
                        ],
                      )
                    );

                    if (confirm != true) return;

                    try {
                      await tripProvider.startTrip(widget.trip.id, driver.id); // No OTP
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
                  onPressed: tripProvider.isLoading ? null : () => _showCompletionDialog(driver.id, tripProvider),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                  child: const Text('COMPLETE TRIP'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showCompletionDialog(String driverId, TripProvider tripProvider) {
    final kmController = TextEditingController();
    
    // Auto-calculate hours
    double roundedHours = 0;
    if (widget.trip.startTime != null) {
      final diff = DateTime.now().difference(widget.trip.startTime!);
      roundedHours = double.parse((diff.inMinutes / 60.0).toStringAsFixed(2));
    }
    final hourController = TextEditingController(text: roundedHours > 0 ? roundedHours.toString() : '');

    final tollController = TextEditingController();
    final permitController = TextEditingController();
    final extraKmController = TextEditingController();
    final extraHourController = TextEditingController();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text("Complete Trip Details"),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: kmController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Total KMS *', hintText: 'e.g. 150.5'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: hourController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Total Hours *', hintText: 'e.g. 8.5'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: tollController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Toll / Parking', hintText: '0.00'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: permitController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Permit', hintText: '0.00'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: extraKmController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Extra KMS', hintText: '0.00'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: extraHourController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Extra Hours', hintText: '0.00'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("CANCEL"),
          ),
          ElevatedButton(
            onPressed: () async {
              if (kmController.text.isEmpty || hourController.text.isEmpty) {
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Total KMS and Hours are required")));
                 return;
              }

              final data = {
                'totalKm': double.tryParse(kmController.text) ?? 0,
                'totalHours': double.tryParse(hourController.text) ?? 0,
                'tollParking': double.tryParse(tollController.text) ?? 0,
                'permit': double.tryParse(permitController.text) ?? 0,
                'extraKm': double.tryParse(extraKmController.text) ?? 0,
                'extraHours': double.tryParse(extraHourController.text) ?? 0,
              };

              Navigator.pop(ctx); // Close dialog

              try {
                await tripProvider.completeTrip(widget.trip.id, data, driverId);
                _showSuccess("Trip Completed Successfully!");
                if (mounted) Navigator.pop(context); // Close screen
              } catch (e) {
                _showError("Failed to complete: $e");
              }
            },
            child: const Text("SUBMIT"),
          ),
        ],
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
