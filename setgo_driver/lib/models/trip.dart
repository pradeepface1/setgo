class Trip {
  final String id;
  final String pickupLocation;
  final String dropLocation;
  final DateTime tripDateTime;
  final String status;
  final DateTime? startTime;
  final String? otp;
  final Map<String, dynamic>? vehicle;
  final Map<String, dynamic>? driver;

  final String? customerName;
  final String? customerPhone;
  final String? pickupType;
  final Map<String, dynamic>? pickupContext;
  final String? googleLocation;

  Trip({
    required this.id,
    required this.pickupLocation,
    required this.dropLocation,
    required this.tripDateTime,

    required this.status,
    this.startTime,
    this.otp,
    this.vehicle,
    this.driver,
    this.customerName,
    this.customerPhone,
    this.pickupType,
    this.pickupContext,
    this.googleLocation,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    try {
      return Trip(
        id: json['_id']?.toString() ?? '',
        pickupLocation: json['pickupLocation'] is Map 
            ? json['pickupLocation']['address']?.toString() ?? 'Unknown'
            : json['pickupLocation']?.toString() ?? 'Unknown',
        dropLocation: json['dropLocation'] is Map 
            ? json['dropLocation']['address']?.toString() ?? 'Unknown'
            : json['dropLocation']?.toString() ?? 'Unknown',
        tripDateTime: DateTime.tryParse(json['tripDateTime']?.toString() ?? '') ?? DateTime.now(),
        status: json['status']?.toString() ?? 'UNKNOWN',
        startTime: json['startTime'] != null ? DateTime.tryParse(json['startTime'].toString()) : null,
        otp: json['otp']?.toString(),
        // Safely handle vehicle: check if Map, then cast
        vehicle: json['vehicle'] is Map ? Map<String, dynamic>.from(json['vehicle']) : null, 
        // Safely handle driver: check if Map, then cast
        driver: json['assignedDriver'] is Map ? Map<String, dynamic>.from(json['assignedDriver']) : null,
        customerName: json['customerName']?.toString(),
        customerPhone: json['customerPhone']?.toString() ?? json['customerContact']?.toString(),
        pickupType: json['pickupType']?.toString(),
        pickupContext: json['pickupContext'] is Map ? Map<String, dynamic>.from(json['pickupContext']) : null,
        googleLocation: json['googleLocation']?.toString(),
      );
    } catch (e) {
      print("Error parsing Trip: $e");
      print("JSON: $json");
      return Trip(
        id: json['_id']?.toString() ?? 'error',
        pickupLocation: 'Error Parsing',
        dropLocation: 'Error Parsing',
        tripDateTime: DateTime.now(),
        status: 'ERROR',
      );
    }
  }
}
