import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/store.dart' as store;
import '../ui/theme.dart';

/// Première connexion : prénom de l'enfant, classe et code de l'espace parent.
class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});
  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final name = TextEditingController();
  final pin = TextEditingController();
  int level = 4;
  bool busy = false;
  String err = '';

  Future<void> submit() async {
    final s = AppScope.of(context);
    setState(() { busy = true; err = ''; });
    try {
      await store.setupFamily(s.uid!, name.text, pin.text, level);
      await s.refresh();
    } catch (_) {
      setState(() => err = "L'enregistrement a échoué. Vérifiez la connexion et réessayez.");
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Sheet(
        maxWidth: 600,
        child: ListView(padding: const EdgeInsets.all(28), children: [
          Text('PREMIÈRE UTILISATION', style: body(14, color: C.inkSoft, weight: FontWeight.w700)),
          Text('Bienvenue', style: display(46, color: C.court)),
          const SizedBox(height: 16),
          TextField(controller: name, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: "Prénom de l'enfant"), onChanged: (_) => setState(() {})),
          const SizedBox(height: 16),
          Text('Classe', style: body(16, weight: FontWeight.w700)),
          Wrap(spacing: 6, children: [
            for (var n = 1; n <= 8; n++) ChoiceChip(label: Text('${n}P'), selected: level == n, onSelected: (_) => setState(() => level = n)),
          ]),
          const SizedBox(height: 16),
          TextField(
            controller: pin,
            keyboardType: TextInputType.number,
            maxLength: 4,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Code parent (4 chiffres)', helperText: "Il protège l'espace parent. Choisissez un code que votre enfant ne connaît pas."),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: BigButton(busy ? 'Création…' : 'Commencer',
                onPressed: busy || name.text.trim().isEmpty || !RegExp(r'^\d{4}$').hasMatch(pin.text) ? null : submit),
          ),
          if (err.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(err, style: body(16, color: C.no))),
        ]),
      ),
    );
  }
}
