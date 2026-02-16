import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/trip_provider.dart';
import '../services/location_service.dart';
import 'history_screen.dart';
import 'my_trips_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final Completer<GoogleMapController> _controller = Completer<GoogleMapController>();
  LocationService? _locationService;
  
  final TextEditingController _pickupController = TextEditingController();
  final TextEditingController _dropController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  // New Controllers
  final TextEditingController _flightNoController = TextEditingController();
  final TextEditingController _trainNoController = TextEditingController();
  final TextEditingController _busNoController = TextEditingController();
  final TextEditingController _googleLocController = TextEditingController();

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  String? _vehicleCategory;
  String? _vehicleType;
  String? _pickupType; // New State Variable

  // Vehicle Data Mapping (Category -> Types)
  final Map<String, List<String>> _vehicleData = {
    'Sedan Regular': ['Swift Dzire', 'Etios', 'Aura'],
    'Sedan Premium': ['Benz E Class', 'BMW 5 Series', 'Audi A6'],
    'Sedan Premium+': ['Benz S Class', 'BMW 7 Series'],
    'SUV - Regular': ['Innova Crysta', 'Ertiga'],
    'SUV - Premium': ['Innova Hycross', 'Fortuner'],
    'Tempo Traveller': ['12 Seater Basic'],
    'Force Premium': ['Urbania 16 Seater'],
    'Bus': ['20 Seater', '25 Seater', '33 Seater', '40 Seater', '50 Seater'],
    'High End Coaches': ['Commuter', 'Vellfire', 'Benz Van']
  };
  
  List<String> get _vehicleCategories => _vehicleData.keys.toList();
  List<String> _currentVehicleTypes = [];

  // Default (Mumbai)
  static const CameraPosition _kGooglePlex = CameraPosition(
    target: LatLng(19.0760, 72.8777),
    zoom: 14.0,
  );
  
  Set<Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null) {
        Provider.of<TripProvider>(context, listen: false).fetchMyTrips();
        
        // Pre-fill name if available
        // _nameController.text = user.username; // Removed default name

        // _phoneController.text = user.id; // Removed: ID is not a phone number

        // Initialize Socket
        _locationService = LocationService(user.id);
        _locationService!.init();
        
        // Listen to Driver Updates
        _locationService!.driverLocationStream.listen((data) async {
           if (data['lat'] != null && data['lng'] != null) {
             final lat = double.parse(data['lat'].toString());
             final lng = double.parse(data['lng'].toString());
             
             setState(() {
               _markers = {
                 Marker(
                   markerId: const MarkerId('driver'),
                   position: LatLng(lat, lng),
                   icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
                   infoWindow: const InfoWindow(title: "Driver Location"),
                 )
               };
             });
             
             if (_controller.isCompleted) {
               final GoogleMapController controller = await _controller.future;
               controller.animateCamera(CameraUpdate.newLatLng(LatLng(lat, lng)));
             }
           }
        });
      }
    });
  }

  @override
  void dispose() {
    _locationService?.dispose();
    _pickupController.dispose();
    _dropController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _flightNoController.dispose();
    _trainNoController.dispose();
    _busNoController.dispose();
    _googleLocController.dispose();
    super.dispose();
  }

  Future<void> _selectDateTime(BuildContext context) async {
    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
    );
    if (pickedDate != null) {
      final TimeOfDay? pickedTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
      );
      if (pickedTime != null) {
        setState(() {
          _selectedDate = pickedDate;
          _selectedTime = pickedTime;
        });
      }
    }
  }

  void _clearForm() {
    setState(() {
      _pickupController.clear();
      _dropController.clear();
      _nameController.clear(); // Clear name as per "remove all values"
      _phoneController.clear(); // Clear phone as per "remove all values"
      _selectedDate = null;
      _selectedTime = null;
      _vehicleCategory = null;
      _vehicleType = null;
      _pickupType = null;
      _flightNoController.clear();
      _trainNoController.clear();
      _busNoController.clear();
      _googleLocController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    
    return Scaffold(
      appBar: AppBar(
        title: Text("Welcome, ${user?.username ?? 'Admin'}"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<TripProvider>().fetchMyTrips(),
          )
        ],
      ),
      drawer: Drawer(
        child: ListView(
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                color: Color(0xFF667EEA),
              ),
              accountName: Row(
                children: [
                   Image.asset('assets/logo.png', height: 32, fit: BoxFit.contain),
                   const SizedBox(width: 8),
                   const Text(
                    "Commuter Admin",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                   ),
                ],
              ),
              accountEmail: Text(user?.username ?? 'User'),
            ),
            ListTile(
              leading: const Icon(Icons.assignment),
              title: const Text('My Trips'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const MyTripsScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Trip History'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Logout'),
              onTap: () => context.read<AuthProvider>().logout(),
            ),
          ],
        ),
      ),
      body: Consumer<TripProvider>(
        builder: (context, tripProvider, _) {
          if (tripProvider.isLoading) return const Center(child: CircularProgressIndicator());
           
          final activeTrip = tripProvider.activeTrip;

          if (activeTrip != null) {
            // Active Trip View
            return Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.blue.withOpacity(0.1),
                  child: Column(
                    children: [
                      Text("Trip Status: ${activeTrip.status}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),

                      const SizedBox(height: 8),
                      Text("Pickup: ${activeTrip.pickupLocation}"),
                      Text("Drop: ${activeTrip.dropLocation}"),
                    ],
                  ),
                ),
                Expanded(
                  child: GoogleMap(
                    initialCameraPosition: _kGooglePlex,
                    markers: _markers,
                    onMapCreated: (GoogleMapController controller) {
                      _controller.complete(controller);
                    },
                  ),
                ),
              ],
            );
          } else {
            // Request Trip Form
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Request a Ride", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 20),
                  
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Name *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.person)),
                  ),
                  const SizedBox(height: 12),
                  
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Phone Number *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.phone)),
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(10),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Pickup Type Dropdown
                  DropdownButtonFormField<String>(
                    value: _pickupType,
                    decoration: const InputDecoration(labelText: 'Pickup Type *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.category)),
                    items: ['AIRPORT', 'RAILWAY_STATION', 'BUS_STAND', 'OTHERS']
                        .map((type) => DropdownMenuItem(value: type, child: Text(type.replaceAll('_', ' '))))
                        .toList(),
                    onChanged: (val) {
                      setState(() {
                        _pickupType = val;
                        // Auto-fill pickup location for Airport
                        if (val == 'AIRPORT') {
                          _pickupController.text = "Airport";
                        } else if (_pickupController.text == "Airport") {
                           _pickupController.clear();
                        }
                      });
                    },
                  ),
                  const SizedBox(height: 12),

                  // Conditional Context Fields
                  if (_pickupType == 'AIRPORT')
                    TextField(
                      controller: _flightNoController,
                      decoration: const InputDecoration(labelText: 'Flight Number *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.flight)),
                    ),
                  if (_pickupType == 'RAILWAY_STATION')
                    TextField(
                      controller: _trainNoController,
                      decoration: const InputDecoration(labelText: 'Train Number *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.train)),
                    ),
                  if (_pickupType == 'BUS_STAND')
                    TextField(
                      controller: _busNoController,
                      decoration: const InputDecoration(labelText: 'Bus Number *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.directions_bus)),
                    ),
                  if (_pickupType != null && _pickupType != 'OTHERS')
                    const SizedBox(height: 12),

                  TextField(
                    controller: _pickupController,
                    decoration: const InputDecoration(labelText: 'Pickup Location *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.my_location)),
                  ),
                  const SizedBox(height: 12),
                  
                  TextField(
                    controller: _googleLocController,
                    decoration: InputDecoration(
                      labelText: 'Google Map Link (Optional)', 
                      border: const OutlineInputBorder(), 
                      prefixIcon: const Icon(Icons.map),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.content_paste),
                        onPressed: () async {
                          final data = await Clipboard.getData(Clipboard.kTextPlain);
                          if (data?.text != null) {
                            _googleLocController.text = data!.text!;
                          }
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  TextField(
                    controller: _dropController,
                    decoration: const InputDecoration(labelText: 'Drop Location *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.location_on)),
                  ),
                  const SizedBox(height: 12),

                  InkWell(
                    onTap: () => _selectDateTime(context),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Date & Time *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.calendar_today)),
                      child: Text(
                        _selectedDate == null 
                          ? 'Select Date & Time' 
                          : "${DateFormat('yyyy-MM-dd').format(_selectedDate!)} ${_selectedTime?.format(context)}",
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  DropdownButtonFormField<String>(
                    value: _vehicleCategory,
                    decoration: const InputDecoration(labelText: 'Vehicle Category *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.directions_car)),
                    items: _vehicleCategories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (v) {
                      setState(() {
                        _vehicleCategory = v!;
                        _vehicleType = null; // Reset type when category changes
                        _currentVehicleTypes = _vehicleData[v] ?? [];
                      });
                    },
                    validator: (value) => value == null ? 'Please select category' : null,
                  ),
                  const SizedBox(height: 12),

                  DropdownButtonFormField<String>(
                    value: _vehicleType,
                    decoration: const InputDecoration(labelText: 'Vehicle Type *', border: OutlineInputBorder(), prefixIcon: Icon(Icons.car_rental)),
                    items: _currentVehicleTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                    onChanged: (v) => setState(() => _vehicleType = v!),
                    validator: (value) => value == null ? 'Please select vehicle type' : null,
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF667EEA), foregroundColor: Colors.white),
                      onPressed: () async {
                         if (_pickupController.text.isEmpty || _dropController.text.isEmpty || 
                             _nameController.text.isEmpty || _phoneController.text.isEmpty || 
                             _selectedDate == null || _vehicleCategory == null || _vehicleType == null) {
                           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please fill all mandatory fields (*)")));
                           return;
                         }

                         if (_pickupType == 'AIRPORT' && _flightNoController.text.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Flight Number is required for Airport pickup")));
                            return;
                         }
                         if (_pickupType == 'RAILWAY_STATION' && _trainNoController.text.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Train Number is required for Railway Station pickup")));
                            return;
                         }
                         if (_pickupType == 'BUS_STAND' && _busNoController.text.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Bus Number is required for Bus Stand pickup")));
                            return;
                         }
                         
                         // Combine Date and Time
                         final dt = DateTime(
                           _selectedDate!.year, _selectedDate!.month, _selectedDate!.day,
                           _selectedTime!.hour, _selectedTime!.minute
                         );

                         // Construct Context
                         Map<String, dynamic> contextData = {};
                         if (_pickupType == 'AIRPORT') contextData['flightNumber'] = _flightNoController.text;
                         if (_pickupType == 'RAILWAY_STATION') contextData['trainNumber'] = _trainNoController.text;
                         if (_pickupType == 'BUS_STAND') contextData['busNumber'] = _busNoController.text;

                         try {
                           await tripProvider.requestTrip({
                             'userId': user!.id,
                             'customerName': _nameController.text,
                             'customerContact': _phoneController.text, // Backend expects customerContact or customerPhone? Check Trip.js. It says customerPhone usually. But schema had customerName, customerPhone. TripProvider sent customerContact. I should check backend/models/Trip.js to be sure.
                             // Actually, let's stick to what was working or align with backend.
                             // Backend Trip.js has `customerPhone`.
                             'customerPhone': _phoneController.text, 
                             'pickupLocation': _pickupController.text,
                             'dropLocation': _dropController.text,
                             'tripDateTime': dt.toIso8601String(),
                             'vehicleCategory': _vehicleCategory,
                             'vehicleSubcategory': _vehicleType,
                             'status': 'PENDING',
                             // New Fields
                             'pickupType': _pickupType ?? 'OTHERS',
                             'pickupContext': contextData,
                             'googleLocation': _googleLocController.text
                           });
                           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Trip Requested Successfully!")));
                           _clearForm();
                         } catch (e) {
                           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
                         }
                      },
                      child: const Text('Request Ride', style: TextStyle(fontSize: 18)),
                    ),
                  ),
                ],
              ),
            );
          }
        },
      ),
    );
  }
}
