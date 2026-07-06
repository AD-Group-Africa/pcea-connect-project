import 'package:flutter/material.dart';
import '../../../../core/network/api_client.dart';

class HomeScreen extends StatefulWidget { const HomeScreen({super.key}); @override State<HomeScreen> createState() => _HomeScreenState(); }
class _HomeScreenState extends State<HomeScreen> {
  String verseOfDay = "", verseRef = "";
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    final res = await ApiClient.get('/bible/devotional');
    final d = res['data'];
    if (d != null) { setState(() { verseOfDay = d['content'] ?? ""; verseRef = d['verseRef'] ?? ""; }); }
  }
  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Home')),
    body: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
      Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
        Text(verseOfDay, style: const TextStyle(fontSize: 18, fontStyle: FontStyle.italic)),
        const SizedBox(height: 8),
        Text(verseRef, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ]))),
    ])));
}
