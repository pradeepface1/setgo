import 'package:flutter/material.dart';

class CommuterProfileScreen extends StatefulWidget {
  const CommuterProfileScreen({super.key});

  @override
  State<CommuterProfileScreen> createState() => _CommuterProfileScreenState();
}

class _CommuterProfileScreenState extends State<CommuterProfileScreen> {
  String _selectedVehiclePref = 'Any';

  final List<String> _vehicleTypes = [
    'Any',
    'Sedan Regular', 'Sedan Premium', 'Sedan Premium+', 
    'SUV Regular', 'SUV Premium', 
    'Tempo Traveller', 'Force Premium', 
    'Bus', 'High-End Coach'
  ];

  void _savePreferences() {
    // Save to shared prefs or API
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Preferences Saved!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Commuter Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Vehicle Preference', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Select your preferred vehicle type for trips.'),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedVehiclePref,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: _vehicleTypes.map((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
                onChanged: (newValue) {
                  setState(() {
                    _selectedVehiclePref = newValue!;
                  });
                },
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _savePreferences,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Save Preferences'),
                ),
              ),
            ],
        ),
      ),
    );
  }
}
