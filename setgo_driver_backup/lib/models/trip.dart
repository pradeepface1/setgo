class Trip {
  final String id;
  final String pickupLocation;
  final String dropLocation;
  final DateTime tripDateTime;
  final String status;
  final String? otp;
  final Map<String, dynamic>? vehicle;
  final Map<String, dynamic>? driver;

  Trip({
    required this.id,
    required this.pickupLocation,
    required this.dropLocation,
    required this.tripDateTime,
    required this.status,
    this.otp,
    this.vehicle,
    this.driver,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['_id'],
      pickupLocation: json['pickupLocation']['address'],
      dropLocation: json['dropLocation']['address'],
      tripDateTime: DateTime.parse(json['tripDateTime']),
      status: json['status'],
      otp: json['otp'],
      vehicle: json['vehicle'],
      driver: json['assignedDriver'],
    );
  }
}
