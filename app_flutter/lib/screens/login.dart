import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../ui/theme.dart';

/// Connexion du parent : e-mail + code à 6 chiffres, ou mot de passe.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final code = TextEditingController();
  final password = TextEditingController();
  String step = 'email'; // email | code | password
  bool busy = false;
  String err = '';

  GoTrueClient get auth => Supabase.instance.client.auth;

  Future<void> run(Future<void> Function() f) async {
    setState(() { busy = true; err = ''; });
    try {
      await f();
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> send() => run(() async {
        try {
          await auth.signInWithOtp(email: email.text.trim(), shouldCreateUser: true);
          setState(() => step = 'code');
        } on AuthException catch (e) {
          setState(() => err = e.statusCode == '429'
              ? "Trop d'e-mails envoyés récemment. Réessayez plus tard, ou saisissez le code d'un e-mail déjà reçu."
              : "L'e-mail n'a pas pu être envoyé. Vérifiez l'adresse et réessayez dans une minute.");
        }
      });

  Future<void> verify() => run(() async {
        try {
          await auth.verifyOTP(email: email.text.trim(), token: code.text.trim(), type: OtpType.email);
        } on AuthException {
          setState(() => err = 'Ce code ne fonctionne pas. Vérifiez les 6 chiffres ou demandez un nouveau code.');
        }
      });

  Future<void> withPassword() => run(() async {
        try {
          await auth.signInWithPassword(email: email.text.trim(), password: password.text);
        } on AuthException {
          setState(() => err = 'E-mail ou mot de passe incorrect.');
        }
      });

  InputDecoration deco(String label) => InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Sheet(
        maxWidth: 560,
        child: ListView(padding: const EdgeInsets.all(28), children: [
          Text('ESPACE PARENT', style: body(14, color: C.inkSoft, weight: FontWeight.w700)),
          Text('Les balles', style: display(46, color: C.court)),
          Text("Connectez-vous une fois sur cet appareil. L'enfant n'aura plus rien à saisir ensuite.", style: body(18)),
          const SizedBox(height: 22),
          if (step != 'code') ...[
            TextField(controller: email, keyboardType: TextInputType.emailAddress, autocorrect: false, decoration: deco('Votre e-mail'), onChanged: (_) => setState(() {})),
            const SizedBox(height: 14),
          ],
          if (step == 'email') ...[
            Wrap(spacing: 12, runSpacing: 12, children: [
              BigButton(busy ? 'Envoi…' : 'Recevoir un code', onPressed: busy || !email.text.contains('@') ? null : send),
              BigButton("J'ai déjà un code", ghost: true, onPressed: email.text.contains('@') ? () => setState(() { err = ''; step = 'code'; }) : null),
            ]),
            TextButton(onPressed: () => setState(() { err = ''; step = 'password'; }), child: const Text('Se connecter avec un mot de passe')),
          ] else if (step == 'password') ...[
            TextField(controller: password, obscureText: true, decoration: deco('Mot de passe'), onChanged: (_) => setState(() {})),
            const SizedBox(height: 14),
            Wrap(spacing: 12, runSpacing: 12, children: [
              BigButton(busy ? 'Connexion…' : 'Se connecter', onPressed: busy || password.text.isEmpty ? null : withPassword),
              BigButton('Recevoir un code à la place', ghost: true, onPressed: () => setState(() { err = ''; step = 'email'; })),
            ]),
          ] else ...[
            Text('Saisissez le code à 6 chiffres reçu à ${email.text.trim()}.', style: body(18)),
            const SizedBox(height: 12),
            TextField(
              controller: code,
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              maxLength: 6,
              style: display(32),
              decoration: deco('Code reçu par e-mail'),
              onChanged: (v) {
                final digits = v.replaceAll(RegExp(r'\D'), '');
                if (digits != v) code.text = digits;
                setState(() {});
              },
            ),
            Wrap(spacing: 12, runSpacing: 12, children: [
              BigButton(busy ? 'Vérification…' : 'Se connecter', onPressed: busy || code.text.length != 6 ? null : verify),
              BigButton("Changer d'e-mail", ghost: true, onPressed: () => setState(() { step = 'email'; code.clear(); })),
            ]),
          ],
          if (err.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 14), child: Text(err, style: body(16, color: C.no))),
        ]),
      ),
    );
  }
}
