class Trip {
  final String id;
  final String pickupLocation;
  final String dropLocation;
  final DateTime tripDateTime;
  final String status;
  final String? otp;
  final Map<String, dynamic>? vehicle;
  final Map<String, dynamic>? driver;
  final String? pickupType;
  final Map<String, dynamic>? pickupContext;
  final String? googleLocation;

  final String customerName;
  final String vehicleCategory;

  Trip({
    required this.id,
    required this.pickupLocation,
    required this.dropLocation,
    required this.tripDateTime,
    required this.status,
    required this.customerName,
    required this.vehicleCategory,
    this.otp,
    this.vehicle,
    this.driver,
    this.pickupType,
    this.pickupContext,
    this.googleLocation,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['_id'],
      pickupLocation: json['pickupLocation'] is Map 
          ? json['pickupLocation']['address'] 
          : json['pickupLocation'] ?? 'Unknown',
      dropLocation: json['dropLocation'] is Map 
          ? json['dropLocation']['address'] 
          : json['dropLocation'] ?? 'Unknown',
      tripDateTime: DateTime.parse(json['tripDateTime']),
      status: json['status'],
      customerName: json['customerName'] ?? 'Unknown',
      vehicleCategory: json['vehicleCategory'] ?? json['vehiclePreference'] ?? 'Unknown',
      otp: json['otp'],
      vehicle: json['vehicle'],
      driver: json['assignedDriver'],
      pickupType: json['pickupType'],
      pickupContext: json['pickupContext'],
      googleLocation: json['googleLocation'],
    );
  }
}
