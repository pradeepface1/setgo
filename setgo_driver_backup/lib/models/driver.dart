class Driver {
  final String id;
  final String name;
  final String phone;
  final String vehicleModel;
  final String vehicleNumber;
  final String status;
  final String organizationId;
  final String? organizationName;
  final String? token;

  Driver({
    required this.id,
    required this.name,
    required this.phone,
    required this.vehicleModel,
    required this.vehicleNumber,
    required this.status,
    required this.organizationId,
    this.organizationName,
    this.token,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['_id'],
      name: json['name'],
      phone: json['phone'],
      vehicleModel: json['vehicleModel'],
      vehicleNumber: json['vehicleNumber'],
      status: json['status'],
      organizationId: json['organizationId'],
      organizationName: json['organizationName'],
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'phone': phone,
      'vehicleModel': vehicleModel,
      'vehicleNumber': vehicleNumber,
      'status': status,
      'organizationId': organizationId,
      'organizationName': organizationName,
      'token': token,
    };
  }
}
