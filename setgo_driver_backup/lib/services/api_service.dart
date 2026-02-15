import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class ApiService {
  late Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: Constants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Add interceptor to attach token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final String? token = prefs.getString('auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // Handle global errors (e.g., 401 Unauthorized) here if needed
        return handler.next(e);
      },
    ));
  }

  Dio get client => _dio;
}
