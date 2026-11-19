class Exercise {
  final String id, type, title;
  final Map<String, dynamic> config;
  final bool active;
  final int position;
  const Exercise({required this.id, required this.type, required this.title, required this.config, this.active = true, this.position = 0});

  factory Exercise.fromJson(Map<String, dynamic> j) => Exercise(
        id: j['id'] as String,
        type: j['type'] as String,
        title: j['title'] as String? ?? '',
        config: Map<String, dynamic>.from(j['config'] as Map? ?? const {}),
        active: j['active'] as bool? ?? true,
        position: (j['position'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {'id': id, 'type': type, 'title': title, 'config': config, 'active': active, 'position': position};
}

class Child {
  final String id, name;
  final String? mascotName;
  final int level;
  const Child({required this.id, required this.name, this.mascotName, this.level = 4});

  factory Child.fromJson(Map<String, dynamic> j) => Child(
        id: j['id'] as String,
        name: j['name'] as String? ?? '',
        mascotName: j['mascot_name'] as String?,
        level: (j['level'] as num?)?.toInt() ?? 4,
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'mascot_name': mascotName, 'level': level};
}

class Family {
  final List<Child> children;
  final List<Exercise> exercises;
  final String pin;
  final int packPrice;
  const Family({required this.children, required this.exercises, this.pin = '1234', this.packPrice = 10});

  factory Family.fromJson(Map<String, dynamic> j) => Family(
        children: (j['children'] as List).map((e) => Child.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
        exercises: (j['exercises'] as List).map((e) => Exercise.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
        pin: j['pin'] as String? ?? '1234',
        packPrice: (j['packPrice'] as num?)?.toInt() ?? 10,
      );

  Map<String, dynamic> toJson() => {
        'children': children.map((c) => c.toJson()).toList(),
        'exercises': exercises.map((e) => e.toJson()).toList(),
        'pin': pin,
        'packPrice': packPrice,
      };
}

/// Une réponse de l'enfant, telle qu'elle part dans la table attempts.
class AttemptDraft {
  final String? exerciseId;
  final String exerciseType;
  final Map<String, dynamic> prompt;
  final String expected, given;
  final bool correct, firstTry;
  const AttemptDraft({this.exerciseId, required this.exerciseType, required this.prompt, required this.expected, required this.given, required this.correct, required this.firstTry});
}
