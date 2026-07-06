import 'package:flutter/material.dart';

class AppTheme {
  static final light = ThemeData(
    colorSchemeSeed: const Color(0xFF2E7D32),
    brightness: Brightness.light,
    useMaterial3: true,
    cardTheme: CardTheme(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );

  static final dark = ThemeData(
    colorSchemeSeed: const Color(0xFF2E7D32),
    brightness: Brightness.dark,
    useMaterial3: true,
    cardTheme: CardTheme(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );
}
