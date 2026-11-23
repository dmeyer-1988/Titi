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
    const Exercise(id: 'e1', type: 'entoure', title: 'Les balles — dizaines', config: {'min': 10, 'max': 90, 'onlyTens': true, 'questions': 10}, position: 6),
    const Exercise(id: 'e2', type: 'paquets', title: 'Fais des paquets de 10', config: {'min': 11, 'max': 49, 'extra': true, 'questions': 5}, position: 7),
    const Exercise(id: 'e3', type: 'suite', title: 'De 10 en 10', config: {'min': 10, 'max': 100, 'step': 10, 'length': 6, 'blanks': 2, 'direction': 'up', 'questions': 10}, position: 8),
    const Exercise(id: 'e4', type: 'table', title: 'Les nombres manquants', config: {'min': 2, 'max': 9, 'size': 4, 'mode': 'mixte', 'questions': 2}, position: 9),
    const Exercise(id: 'e5', type: 'noeuds', title: 'Les nœuds', config: {'size': 5, 'skills': ['lire', 'placer', 'bouger'], 'questions': 8}, position: 10),
    const Exercise(id: 'e6', type: 'chateaux', title: 'Les tours de cubes', config: {'towers': 2, 'maxTotal': 20, 'questions': 5}, position: 11),
    const Exercise(id: 'e7', type: 'capacite', title: 'Qui contient le plus ?', config: {'compare': 'lire', 'questions': 6}, position: 12),
    const Exercise(id: 'e8', type: 'suite', title: 'Compter de 1 en 1 (à l’oral)', config: {'min': 0, 'max': 100, 'step': 1, 'length': 6, 'blanks': 6, 'direction': 'up', 'oral': true, 'questions': 6}, position: 13),
  ],
);
