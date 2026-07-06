import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiClient {
  static const baseUrl = 'http://10.0.2.2:8087/api'; // Android emulator localhost

  static Future<Map<String, dynamic>> get(String path, {String? token}) async {
    final headers = <String, String>{};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    final response = await http.get(Uri.parse('$baseUrl$path'), headers: headers);
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body, {String? token}) async {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    final response = await http.post(Uri.parse('$baseUrl$path'), headers: headers, body: jsonEncode(body));
    return jsonDecode(response.body);
  }
}
