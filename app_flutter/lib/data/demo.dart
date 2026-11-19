import 'models.dart';

/// Famille fictive du mode démo (captures d'écran, essais sans compte).
final demoFamily = Family(
  children: const [Child(id: 'demo-child', name: 'Timaé', mascotName: 'Bigou')],
  exercises: [
    const Exercise(id: 'd1', type: 'combien', title: 'Combien de balles ?', config: {'min': 11, 'max': 59, 'onlyTens': false, 'questions': 10}),
    const Exercise(id: 'd2', type: 'calcul', title: 'Additions +0 à +10', config: {'op': '+', 'steps': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'digits': 2, 'find': 'resultat', 'questions': 10}, position: 1),
    const Exercise(id: 'd3', type: 'calcul', title: 'Calculer efficacement', config: {'op': '+', 'steps': [0, 1, 2], 'digits': 2, 'find': 'resultat', 'astuces': true, 'questions': 10}, position: 2),
    const Exercise(id: 'd4', type: 'son', title: 'Le son on / om', config: {'focus': ['ombre', 'tomber', 'prénom', 'nom', 'ballon', 'pompon', 'bonbon'], 'extra': true, 'showRule': true, 'questions': 12}, position: 3),
    const Exercise(id: 'd5', type: 'drapeaux', title: 'Les drapeaux du monde', config: {'niveau': 'facile', 'sens': 'mix', 'questions': 10}, position: 4),
    const Exercise(id: 'd6', type: 'dictee', title: 'Dictée — Liste 5', config: {}, position: 5),
  ],
);
