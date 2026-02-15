class User {
  final String id;
  final String username;
  final String role;
  final String? organizationId;
  final String? organizationName;
  final String? token;

  User({
    required this.id,
    required this.username,
    required this.role,
    this.organizationId,
    this.organizationName,
    this.token,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      username: json['username'],
      role: json['role'],
      organizationId: json['organizationId'],
      organizationName: json['organizationName'],
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'username': username,
      'role': role,
      'organizationId': organizationId,
      'organizationName': organizationName,
      'token': token,
    };
  }
}
