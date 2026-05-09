import { PrismaClient, type MovementCategory } from "@prisma/client";

type StandardMovement = {
  slug: string;
  name: string;
  category: MovementCategory;
  standardDescription: string;
  videoUrl: string | null;
  equipment: string[];
};

export const STANDARD_MOVEMENTS: StandardMovement[] = [
  // OLYMPIC
  {
    slug: "thruster",
    name: "Thruster",
    category: "OLYMPIC",
    standardDescription:
      "Front squat into overhead press in one fluid movement. Score: weight (kg). Tips RX: bar en rack frontal, codos altos en squat, presionar explosivo desde el bottom.",
    videoUrl: "https://www.youtube.com/embed/L219ltL15zk",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "clean",
    name: "Clean",
    category: "OLYMPIC",
    standardDescription:
      "Pull explosivo del suelo a rack frontal. Score: weight (kg). Tips RX: extensión triple completa, drop rápido bajo la barra, codos altos en el catch.",
    videoUrl: "https://www.youtube.com/embed/EKRiW9Yt3Ps",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "snatch",
    name: "Snatch",
    category: "OLYMPIC",
    standardDescription:
      "Levantamiento desde el suelo hasta overhead en un movimiento continuo. Score: weight (kg). Tips RX: agarre amplio, barra cerca del cuerpo, recibir en squat profundo.",
    videoUrl: "https://www.youtube.com/embed/9xQp2sldyts",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "clean-and-jerk",
    name: "Clean and Jerk",
    category: "OLYMPIC",
    standardDescription:
      "Combinación de clean + jerk. Score: weight (kg). Tips RX: recuperar bien del clean antes del jerk, split position segura.",
    videoUrl: "https://www.youtube.com/embed/5EiLkyeCGp8",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "power-clean",
    name: "Power Clean",
    category: "OLYMPIC",
    standardDescription:
      "Clean recibido por encima del paralelo. Score: weight (kg). Tips RX: extensión triple, recibir en quarter squat.",
    videoUrl: "https://www.youtube.com/embed/IwjMiEEtbMo",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "dumbbell-snatch",
    name: "Dumbbell Snatch",
    category: "OLYMPIC",
    standardDescription:
      "Snatch con mancuerna alternando brazos. Score: reps o weight. Tips RX: neutral lower back, rotación del hombro al final.",
    videoUrl: "https://www.youtube.com/embed/9rRMFYPdYhg",
    equipment: ["Dumbbell"],
  },
  {
    slug: "dumbbell-clean",
    name: "Dumbbell Clean",
    category: "OLYMPIC",
    standardDescription:
      "Clean con mancuernas (ambas manos). Score: reps o weight. Tips RX: mismo patrón que barbell clean, mantener core.",
    videoUrl: "https://www.youtube.com/embed/CUaxieWW0tw",
    equipment: ["Dumbbell"],
  },
  {
    slug: "turkish-get-up",
    name: "Turkish Get-Up",
    category: "OLYMPIC",
    standardDescription:
      "Levantamiento desde el suelo hasta de pie con kettlebell en overhead. Score: weight (kg). Tips RX: brazo perpendicular al suelo todo el movimiento, lento y controlado.",
    videoUrl: "https://www.youtube.com/embed/0bWRPC49-KI",
    equipment: ["Kettlebell"],
  },

  // STRENGTH
  {
    slug: "push-press",
    name: "Push Press",
    category: "STRENGTH",
    standardDescription:
      "Press overhead con impulso de piernas (dip & drive). Score: weight (kg). Tips RX: dip recto, drive vertical, no hyper-extend al lockout.",
    videoUrl: "https://www.youtube.com/embed/iaBVSJm78ko",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "push-jerk",
    name: "Push Jerk",
    category: "STRENGTH",
    standardDescription:
      "Jerk con recepción en press position (no split). Score: weight (kg). Tips RX: drop bajo la barra, lockout antes de recuperar.",
    videoUrl: "https://www.youtube.com/embed/V-hKuAfWNUw",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "deadlift",
    name: "Deadlift",
    category: "STRENGTH",
    standardDescription:
      "Levantamiento desde el suelo hasta extensión completa de cadera. Score: weight (kg). Tips RX: espalda neutral, bar over mid-foot, empujar el suelo.",
    videoUrl: "https://www.youtube.com/embed/op9kVnSso6Q",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "back-squat",
    name: "Back Squat",
    category: "STRENGTH",
    standardDescription:
      "Sentadilla con barra en posición posterior (high bar). Score: weight (kg). Tips RX: depth = crease of hip below top of knee, torso vertical.",
    videoUrl: "https://www.youtube.com/embed/ultWZbUMPL8",
    equipment: ["Barbell", "Plates", "Rack"],
  },
  {
    slug: "front-squat",
    name: "Front Squat",
    category: "STRENGTH",
    standardDescription:
      "Sentadilla con barra en rack frontal. Score: weight (kg). Tips RX: codos altos para no perder la barra, torso muy vertical.",
    videoUrl: "https://www.youtube.com/embed/uYumuL_G_V0",
    equipment: ["Barbell", "Plates", "Rack"],
  },
  {
    slug: "overhead-squat",
    name: "Overhead Squat",
    category: "STRENGTH",
    standardDescription:
      "Sentadilla con barra en overhead (agarre snatch). Score: weight (kg). Tips RX: activa el overhead, piernas abiertas.",
    videoUrl: "https://www.youtube.com/embed/RD_vUnqwqqI",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "bench-press",
    name: "Bench Press",
    category: "STRENGTH",
    standardDescription:
      "Press en banco plano. Score: weight (kg). Tips RX: retract escápulas, pies en el suelo, bar path curva hacia el pecho.",
    videoUrl: "https://www.youtube.com/embed/vcBig73ojpE",
    equipment: ["Barbell", "Plates", "Bench"],
  },
  {
    slug: "strict-press",
    name: "Strict Press",
    category: "STRENGTH",
    standardDescription:
      "Press overhead estricto (sin impulso de piernas). Score: weight (kg). Tips RX: glutes apretados, no hyperextender lumbar.",
    videoUrl: "https://www.youtube.com/embed/2yjwXTZQDDI",
    equipment: ["Barbell", "Plates"],
  },
  {
    slug: "farmers-carry",
    name: "Farmers Carry",
    category: "STRENGTH",
    standardDescription:
      "Caminata cargando peso en ambas manos. Score: distance (m) o weight (kg). Tips RX: hombros atrás y abajo, pasos cortos y rápidos.",
    videoUrl: "https://www.youtube.com/embed/cBv3NcxqhPM",
    equipment: ["Kettlebell", "Dumbbell"],
  },

  // GYMNASTICS
  {
    slug: "pull-up",
    name: "Pull-up",
    category: "GYMNASTICS",
    standardDescription:
      "Jalón en barra fija hasta que el mentón supere la barra. Score: reps. Tips RX: full ROM, chin clearly over the bar.",
    videoUrl: "https://www.youtube.com/embed/eGo4IYlbE5g",
    equipment: ["Pull-up bar"],
  },
  {
    slug: "kipping-pull-up",
    name: "Kipping Pull-up",
    category: "GYMNASTICS",
    standardDescription:
      "Pull-up con kip (movimiento de cadera para generar momentum). Score: reps. Tips RX: hollow-arch cycle, no chicken-wing.",
    videoUrl: "https://www.youtube.com/embed/JrHciIJQMBQ",
    equipment: ["Pull-up bar"],
  },
  {
    slug: "chest-to-bar",
    name: "Chest-to-Bar",
    category: "GYMNASTICS",
    standardDescription:
      "Pull-up donde el pecho toca la barra. Score: reps. Tips RX: el pecho (no la barbilla) debe hacer contacto con la barra.",
    videoUrl: "https://www.youtube.com/embed/MzmJmRGFVDo",
    equipment: ["Pull-up bar"],
  },
  {
    slug: "muscle-up-ring",
    name: "Muscle-up (Ring)",
    category: "GYMNASTICS",
    standardDescription:
      "Transición de pull a dip en anillos. Score: reps. Tips RX: false grip, aggressive pull, false press out.",
    videoUrl: "https://www.youtube.com/embed/6nQu-Y8Plbk",
    equipment: ["Rings"],
  },
  {
    slug: "muscle-up-bar",
    name: "Muscle-up (Bar)",
    category: "GYMNASTICS",
    standardDescription:
      "Transición de pull a dip en barra fija. Score: reps. Tips RX: hips to bar en el pull, salida limpia.",
    videoUrl: "https://www.youtube.com/embed/P099n4qjKy0",
    equipment: ["Pull-up bar"],
  },
  {
    slug: "toes-to-bar",
    name: "Toes-to-Bar",
    category: "GYMNASTICS",
    standardDescription:
      "Desde colgado en barra, llevar los pies hasta tocar la barra. Score: reps. Tips RX: ambos pies tocan simultáneamente.",
    videoUrl: "https://www.youtube.com/embed/_03pCKOv4l4",
    equipment: ["Pull-up bar"],
  },
  {
    slug: "handstand-push-up",
    name: "Handstand Push-up",
    category: "GYMNASTICS",
    standardDescription:
      "Press de hombros en posición invertida contra pared. Score: reps. Tips RX: head touches floor = ROM completo.",
    videoUrl: "https://www.youtube.com/embed/IHGhp3pW6FE",
    equipment: ["Wall"],
  },
  {
    slug: "handstand-walk",
    name: "Handstand Walk",
    category: "GYMNASTICS",
    standardDescription:
      "Caminata en posición invertida. Score: distance (m). Tips RX: hombros abiertos, mira al frente, pasos pequeños.",
    videoUrl: "https://www.youtube.com/embed/FdgJ9jZIT-Q",
    equipment: [],
  },
  {
    slug: "ring-dip",
    name: "Ring Dip",
    category: "GYMNASTICS",
    standardDescription:
      "Dip en anillos con full lockout. Score: reps. Tips RX: turnout al top, chest no forward-lean excesivo.",
    videoUrl: "https://www.youtube.com/embed/YFimRjwqCH8",
    equipment: ["Rings"],
  },
  {
    slug: "bar-dip",
    name: "Bar Dip",
    category: "GYMNASTICS",
    standardDescription:
      "Dip en barras paralelas. Score: reps. Tips RX: full ROM — shoulder below elbow al bottom.",
    videoUrl: "https://www.youtube.com/embed/eERwCQHZqfA",
    equipment: ["Parallel bars"],
  },
  {
    slug: "rope-climb",
    name: "Rope Climb",
    category: "GYMNASTICS",
    standardDescription:
      "Subida de cuerda. Score: reps (ascents). Tips RX: S-wrap con los pies para grip; usar J-hook para eficiencia.",
    videoUrl: "https://www.youtube.com/embed/E2hWMlqxBaw",
    equipment: ["Rope"],
  },
  {
    slug: "pistol-squat",
    name: "Pistol Squat",
    category: "GYMNASTICS",
    standardDescription:
      "Sentadilla a una pierna. Score: reps (cada pierna). Tips RX: pierna libre extendida, tocar suelo = full depth.",
    videoUrl: "https://www.youtube.com/embed/vq5-vdgJc0I",
    equipment: [],
  },
  {
    slug: "hollow-rock",
    name: "Hollow Rock",
    category: "GYMNASTICS",
    standardDescription:
      "Posición hollow mantenida mientras se balancea. Score: reps. Tips RX: lower back pegada al suelo, piernas y brazos extendidos.",
    videoUrl: "https://www.youtube.com/embed/SfkuOb_1GK8",
    equipment: [],
  },
  {
    slug: "jumping-pull-up",
    name: "Jumping Pull-up",
    category: "GYMNASTICS",
    standardDescription:
      "Pull-up con impulso de piernas desde el suelo. Score: reps. Tips RX: chin clearly over bar, control en el descenso.",
    videoUrl: "https://www.youtube.com/embed/oBIFjk3cSQ4",
    equipment: ["Pull-up bar"],
  },
  {
    slug: "knee-raise",
    name: "Knee Raise",
    category: "GYMNASTICS",
    standardDescription:
      "Desde colgado en barra, llevar las rodillas al pecho. Score: reps. Escalada de toes-to-bar.",
    videoUrl: "https://www.youtube.com/embed/lW4onyuCkzA",
    equipment: ["Pull-up bar"],
  },
  {
    slug: "bar-muscle-up",
    name: "Bar Muscle-up",
    category: "GYMNASTICS",
    standardDescription:
      "Muscle-up en barra fija. Score: reps. Tips RX: hip-to-bar aggressive pull, clean press-out.",
    videoUrl: "https://www.youtube.com/embed/P099n4qjKy0",
    equipment: ["Pull-up bar"],
  },

  // MONOSTRUCTURAL
  {
    slug: "run",
    name: "Run",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Carrera. Score: time (s) o distance (m). Tips RX: midfoot strike, cadencia alta, hombros relajados.",
    videoUrl: "https://www.youtube.com/embed/y1wnFWIisq8",
    equipment: [],
  },
  {
    slug: "row",
    name: "Row (Concept2)",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Remo en ergómetro Concept2. Score: time (s) o distance (m). Tips RX: leg drive primero, luego recline, luego brazos.",
    videoUrl: "https://www.youtube.com/embed/zQ82RYIFLN4",
    equipment: ["Rower"],
  },
  {
    slug: "bike",
    name: "Bike (Assault)",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Bike ergómetro (Assault/Echo). Score: calories o time. Tips RX: 80-85 rpm, empuja y jala los handlebars.",
    videoUrl: "https://www.youtube.com/embed/mY9ihujdkc0",
    equipment: ["Assault Bike"],
  },
  {
    slug: "ski-erg",
    name: "Ski Erg",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Ski ergómetro. Score: calories o time. Tips RX: empujar con el cuerpo hacia abajo, no solo los brazos.",
    videoUrl: "https://www.youtube.com/embed/B0lIgT5PHc8",
    equipment: ["Ski Erg"],
  },
  {
    slug: "double-under",
    name: "Double Under",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Cuerda pasa dos veces por salto. Score: reps. Tips RX: muñecas rápidas, salto recto no donkey-kick.",
    videoUrl: "https://www.youtube.com/embed/82IdFQ9BmWw",
    equipment: ["Jump rope"],
  },
  {
    slug: "single-under",
    name: "Single Under",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Salto de cuerda estándar (una vuelta por salto). Score: reps. Escalada de double-under.",
    videoUrl: "https://www.youtube.com/embed/EwrFMvxMSkk",
    equipment: ["Jump rope"],
  },

  // ACCESSORY
  {
    slug: "air-squat",
    name: "Air Squat",
    category: "ACCESSORY",
    standardDescription:
      "Sentadilla con peso corporal. Score: reps. Tips RX: cadera por debajo de la rodilla, rodillas en línea con pies.",
    videoUrl: "https://www.youtube.com/embed/C_VtOYc6j5c",
    equipment: [],
  },
  {
    slug: "push-up",
    name: "Push-up",
    category: "ACCESSORY",
    standardDescription:
      "Fondos en el suelo. Score: reps. Tips RX: chest & thighs touch floor, full lockout al top.",
    videoUrl: "https://www.youtube.com/embed/IODxDxX7oi4",
    equipment: [],
  },
  {
    slug: "burpee",
    name: "Burpee",
    category: "ACCESSORY",
    standardDescription:
      "Combinación de push-up y salto vertical. Score: reps. Tips RX: chest & thighs to floor, jump y palmas por encima de la cabeza.",
    videoUrl: "https://www.youtube.com/embed/dZgVxmf6jkA",
    equipment: [],
  },
  {
    slug: "box-jump",
    name: "Box Jump",
    category: "ACCESSORY",
    standardDescription:
      "Salto a cajón con two-foot takeoff y landing. Score: reps. Tips RX: full extension de cadera al top.",
    videoUrl: "https://www.youtube.com/embed/52r_Ul5k03g",
    equipment: ["Box"],
  },
  {
    slug: "wall-ball",
    name: "Wall Ball",
    category: "ACCESSORY",
    standardDescription:
      "Squat + lanzamiento de balón a objetivo. Score: reps. Tips RX: target ~3m, catch con squat fluido.",
    videoUrl: "https://www.youtube.com/embed/fpUD0mcFp_0",
    equipment: ["Med ball", "Wall target"],
  },
  {
    slug: "kettlebell-swing",
    name: "Kettlebell Swing",
    category: "ACCESSORY",
    standardDescription:
      "Swing de kettlebell. American (overhead) o Russian (eye level). Score: reps. Tips RX: hip hinge (no squat), explosión de cadera.",
    videoUrl: "https://www.youtube.com/embed/YSxHifyI6s8",
    equipment: ["Kettlebell"],
  },
  {
    slug: "lunge",
    name: "Lunge",
    category: "ACCESSORY",
    standardDescription:
      "Zancada (peso corporal o cargado). Score: reps o distance. Tips RX: rodilla trasera cerca del suelo, torso vertical.",
    videoUrl: "https://www.youtube.com/embed/JRh6_4rq-b8",
    equipment: [],
  },
  {
    slug: "sit-up",
    name: "Sit-up",
    category: "ACCESSORY",
    standardDescription:
      "Abdominal. Score: reps. Tips RX: mariposa position (soles de los pies juntos), manos tocan el suelo tras la cabeza.",
    videoUrl: "https://www.youtube.com/embed/VIZX2Ru9qU8",
    equipment: [],
  },
  {
    slug: "ghd-sit-up",
    name: "GHD Sit-up",
    category: "ACCESSORY",
    standardDescription:
      "Abdominal en máquina GHD (Glute Ham Developer). Score: reps. Tips RX: hiperextensión controlada, manos a los tobillos.",
    videoUrl: "https://www.youtube.com/embed/1pbZ8mX2D1U",
    equipment: ["GHD"],
  },
  {
    slug: "sled-push",
    name: "Sled Push",
    category: "ACCESSORY",
    standardDescription:
      "Empuje de trineo cargado. Score: distance (m) o time. Tips RX: inclinación 45°, pasos cortos y explosivos.",
    videoUrl: "https://www.youtube.com/embed/F7otn_5JdqA",
    equipment: ["Sled"],
  },
  {
    slug: "sled-pull",
    name: "Sled Pull",
    category: "ACCESSORY",
    standardDescription:
      "Jalón de trineo cargado. Score: distance (m). Tips RX: lean atrás, pasos potentes.",
    videoUrl: "https://www.youtube.com/embed/cy1gCkC6InY",
    equipment: ["Sled", "Harness"],
  },
  {
    slug: "devils-press",
    name: "Devil's Press",
    category: "ACCESSORY",
    standardDescription:
      "Burpee + dumbbell snatch (ambos brazos simultáneamente). Score: reps. Tips RX: snatch explosivo desde el burpee.",
    videoUrl: "https://www.youtube.com/embed/cBGQrgovLFM",
    equipment: ["Dumbbell"],
  },
  {
    slug: "man-maker",
    name: "Man Maker",
    category: "ACCESSORY",
    standardDescription:
      "Push-up + row + row + thruster con mancuernas. Score: reps. Tips RX: movimiento fluido, core activo durante el push-up.",
    videoUrl: "https://www.youtube.com/embed/iMNnvhg1JcM",
    equipment: ["Dumbbell"],
  },
];

type MovementEnrichment = {
  cues?: {
    setup?: string[];
    dos?: string[];
    donts?: string[];
  };
  commonMistakes?: Array<{
    title: string;
    description?: string;
    fixCue?: string;
  }>;
  progressions?: Array<{
    name: string;
    level: "beginner" | "intermediate" | "advanced";
    description?: string;
  }>;
  musclesWorked?: string[];
  difficulty?: number;
};

/**
 * Premium-tier enrichment for the 8 most-used movements. Coaches can
 * extend or override per tenant via the admin form.
 */
export const MOVEMENT_ENRICHMENTS: Record<string, MovementEnrichment> = {
  thruster: {
    cues: {
      setup: [
        "Pies a la altura de hombros, dedos ligeramente afuera",
        "Barra en rack frontal, codos altos paralelos al piso",
      ],
      dos: [
        "Mantén core activo durante todo el movimiento",
        "Sube y empuja en un solo flujo sin pausa",
        "Bloquea brazos arriba con la cabeza pasando entre los hombros",
      ],
      donts: [
        "Despegar talones del piso al subir",
        "Separar codos y dejar caer la barra del rack",
        "Hacer dos movimientos separados (squat y luego press)",
      ],
    },
    commonMistakes: [
      {
        title: "Codos caídos en el front rack",
        description: "Pierdes posición y la barra rueda hacia adelante.",
        fixCue: "Codos arriba, dedos sueltos en la barra",
      },
      {
        title: "Press sin usar la cadera",
        description: "Presionar sólo con tríceps quema brazos rapidísimo.",
        fixCue: "Empuja desde piernas, brazos solo guían",
      },
    ],
    progressions: [
      {
        name: "Goblet thruster con dumbbell",
        level: "beginner",
        description: "Mismo patrón con peso al frente, más fácil de balancear.",
      },
      {
        name: "Thruster con barra vacía",
        level: "intermediate",
        description: "Foco en flujo squat-to-press sin carga.",
      },
      {
        name: "Thruster RX (43kg / 30kg)",
        level: "advanced",
      },
    ],
    musclesWorked: ["quads", "glutes", "shoulders", "core", "triceps"],
    difficulty: 4,
  },
  clean: {
    cues: {
      setup: ["Barra cerca del cuerpo, brazos largos", "Espalda neutra"],
      dos: [
        "Extensión triple (tobillos, rodillas, cadera) explosiva",
        "Codos rápidos para recibir en rack frontal",
        "Recibe en cuarter squat antes de pararte",
      ],
      donts: [
        "Tirar con los brazos antes de la extensión",
        "Curvar la espalda baja al despegar",
      ],
    },
    commonMistakes: [
      {
        title: "Brazos doblados temprano",
        fixCue: "Brazos largos hasta que la cadera se abra",
      },
      {
        title: "Recepción con espalda redondeada",
        fixCue: "Pecho arriba al recibir, codos altos",
      },
    ],
    progressions: [
      { name: "Hang clean", level: "beginner" },
      { name: "Power clean", level: "intermediate" },
      { name: "Squat clean", level: "advanced" },
    ],
    musclesWorked: ["hamstrings", "glutes", "traps", "quads", "core"],
    difficulty: 5,
  },
  snatch: {
    cues: {
      setup: [
        "Agarre amplio (snatch grip), pulgares apuntando afuera",
        "Cadera baja, pecho arriba",
      ],
      dos: [
        "Barra cerca del cuerpo durante todo el pull",
        "Extensión triple agresiva",
        "Recibe activo (overhead squat lockout)",
      ],
      donts: ["Soltar pecho al iniciar", "Recibir con codos blandos arriba"],
    },
    commonMistakes: [
      {
        title: "Lockout débil arriba",
        description: "Codos no completamente bloqueados, hombros sueltos.",
        fixCue: "Push the bar up, shrug at the top",
      },
    ],
    progressions: [
      { name: "Snatch deadlift", level: "beginner" },
      { name: "Hang power snatch", level: "intermediate" },
      { name: "Squat snatch", level: "advanced" },
    ],
    musclesWorked: ["shoulders", "traps", "glutes", "core", "hamstrings"],
    difficulty: 5,
  },
  deadlift: {
    cues: {
      setup: [
        "Pies a la cadera, barra sobre el medio del pie",
        "Espalda neutra, hombros ligeramente delante de la barra",
      ],
      dos: [
        "Empuja el piso lejos con piernas",
        "Mantén la barra pegada al cuerpo",
        "Bloquea cadera arriba sin hiperextender",
      ],
      donts: [
        "Redondear la espalda baja",
        'Subir pierna+cadera por separado ("good morning")',
        "Hyperextender la zona lumbar al final",
      ],
    },
    commonMistakes: [
      {
        title: "Caderas suben antes que el pecho",
        description: "Conviertes el deadlift en un good-morning con peso.",
        fixCue: "Empuja el piso, no levantes las caderas",
      },
      {
        title: "Espalda redondeada",
        description: "Riesgo alto de lesión lumbar.",
        fixCue: "Pecho arriba, cinturón apretado",
      },
    ],
    progressions: [
      { name: "Romanian deadlift con KB", level: "beginner" },
      { name: "Conventional deadlift con barra ligera", level: "intermediate" },
      { name: "Deadlift heavy (1.5x BW+)", level: "advanced" },
    ],
    musclesWorked: ["hamstrings", "glutes", "lower back", "lats", "core"],
    difficulty: 3,
  },
  "pull-up": {
    cues: {
      setup: ["Agarre prono ligeramente más amplio que hombros"],
      dos: [
        "Cuerpo en arco hueco al iniciar",
        "Tira con la espalda, no solo brazos",
        "Cabeza pasa la barra completa",
      ],
      donts: [
        "Patear las piernas para impulsarte (a menos que sea kipping intencional)",
        "Cortar el rango (mentón corto)",
      ],
    },
    commonMistakes: [
      {
        title: "Hombros encogidos al iniciar",
        fixCue: "Activa los lats hacia abajo y atrás",
      },
    ],
    progressions: [
      { name: "Ring rows", level: "beginner" },
      { name: "Banded pull-ups", level: "beginner" },
      { name: "Strict pull-up", level: "intermediate" },
      { name: "Chest-to-bar / Butterfly", level: "advanced" },
    ],
    musclesWorked: ["lats", "biceps", "core", "rear delts"],
    difficulty: 3,
  },
  "air-squat": {
    cues: {
      setup: [
        "Pies a la altura de hombros, dedos ligeramente afuera",
        "Mirada al frente, brazos al frente o sobre la cabeza",
      ],
      dos: [
        "Inicia el movimiento con cadera y rodillas a la vez",
        "Rodillas siguen la línea de los pies",
        "Profundidad: cadera por debajo de la rodilla",
      ],
      donts: [
        "Rodillas colapsando hacia adentro",
        "Cargar peso en la punta de los pies",
        "Quedar a media profundidad (squat parcial)",
      ],
    },
    commonMistakes: [
      {
        title: "Rodillas cayendo hacia adentro",
        fixCue: "Empuja las rodillas afuera, contra los pies",
      },
      {
        title: "Talones se despegan del piso",
        description: "Falta movilidad de tobillo o cadera.",
        fixCue: "Pies firmes en el piso, pesa los talones",
      },
    ],
    progressions: [
      { name: "Air squat con caja (box squat)", level: "beginner" },
      { name: "Goblet squat con KB", level: "beginner" },
      { name: "Air squat estándar", level: "intermediate" },
      { name: "Pistol squat", level: "advanced" },
    ],
    musclesWorked: ["quads", "glutes", "hamstrings", "core"],
    difficulty: 1,
  },
  "back-squat": {
    cues: {
      setup: [
        "Barra sobre trapecio (high bar) o deltoide posterior (low bar)",
        "Pies a ancho de hombros, dedos ligeramente afuera",
      ],
      dos: [
        "Mantén el pecho arriba durante todo el descenso",
        "Empuja rodillas hacia los pies",
        "Cadera por debajo de rodilla en el bottom",
      ],
      donts: [
        "Caer hacia adelante (good morning con barra)",
        "Rebote agresivo sin control en el bottom",
        "Hyperextender la lumbar al subir",
      ],
    },
    commonMistakes: [
      {
        title: "Pecho que se hunde al bajar",
        description: "La barra rueda y la lumbar se redondea.",
        fixCue: "Codos abajo, pecho arriba, mira al frente",
      },
      {
        title: "Asimetría de cadera al subir",
        fixCue: "Empuja parejo con ambos pies",
      },
    ],
    progressions: [
      { name: "Goblet squat con KB", level: "beginner" },
      { name: "Air squat profundo", level: "beginner" },
      { name: "Back squat barra vacía", level: "intermediate" },
      { name: "Back squat 1.5x BW+", level: "advanced" },
    ],
    musclesWorked: ["quads", "glutes", "hamstrings", "core", "lower back"],
    difficulty: 3,
  },
  "front-squat": {
    cues: {
      setup: [
        "Barra en rack frontal sobre los deltoides anteriores",
        "Codos altos, paralelos al piso",
      ],
      dos: [
        "Codos altos durante todo el squat",
        "Torso vertical (más vertical que back squat)",
        "Profundidad completa con codos firmes",
      ],
      donts: [
        "Dejar caer codos al bajar (barra rueda hacia adelante)",
        "Inclinarse adelante perdiendo el rack",
      ],
    },
    commonMistakes: [
      {
        title: "Codos caen en el bottom",
        description: "La barra se desprende del rack y se pierde la posición.",
        fixCue: "Codos arriba, dedos sueltos en la barra",
      },
    ],
    progressions: [
      { name: "Front squat con dumbbells (cross-grip)", level: "beginner" },
      { name: "Front squat barra vacía", level: "intermediate" },
      { name: "Front squat heavy (1x BW+)", level: "advanced" },
    ],
    musclesWorked: ["quads", "core", "upper back", "glutes"],
    difficulty: 4,
  },
  "push-up": {
    cues: {
      setup: [
        "Manos a la altura de hombros, ligeramente más amplias",
        "Cuerpo en línea recta de cabeza a talones",
      ],
      dos: [
        "Codos a 45° del torso (no abiertos en T)",
        "Pecho toca el piso en cada rep",
        "Empuja parejo con ambos brazos al subir",
      ],
      donts: [
        "Cadera caída o pop-up al subir",
        "Codos en T abiertos a 90° del torso",
        "Cortar el rango (pecho no toca)",
      ],
    },
    commonMistakes: [
      {
        title: "Cadera caída o levantada",
        description: "Pierdes la línea recta del cuerpo.",
        fixCue: "Cuerpo de tabla, glúteos y core apretados",
      },
    ],
    progressions: [
      { name: "Push-up con rodillas", level: "beginner" },
      { name: "Push-up inclinado en caja/banco", level: "beginner" },
      { name: "Push-up estándar", level: "intermediate" },
      { name: "Strict handstand push-up", level: "advanced" },
    ],
    musclesWorked: ["chest", "triceps", "shoulders", "core"],
    difficulty: 2,
  },
  "push-press": {
    cues: {
      setup: ["Barra en front rack, codos al frente", "Pies a ancho de cadera"],
      dos: [
        "Dip corto y vertical con piernas",
        "Drive explosivo con piernas para iniciar el press",
        "Bloqueo final con cabeza al frente entre brazos",
      ],
      donts: [
        "Dip muy profundo (lo convierte en thruster)",
        "Inclinar el torso adelante en el dip",
        "Press solo con brazos sin usar cadera",
      ],
    },
    commonMistakes: [
      {
        title: "Dip horizontal (rodillas adelante)",
        fixCue: "Dip vertical, cadera baja directo",
      },
      {
        title: "Bloqueo con codos blandos",
        fixCue: "Empuja la cabeza por la ventana, codos duros",
      },
    ],
    progressions: [
      { name: "Strict press con barra vacía", level: "beginner" },
      { name: "Push press con barra vacía", level: "intermediate" },
      { name: "Push jerk / split jerk", level: "advanced" },
    ],
    musclesWorked: ["shoulders", "triceps", "quads", "core"],
    difficulty: 3,
  },
  "strict-press": {
    cues: {
      setup: [
        "Barra en front rack, manos a ancho de hombros",
        "Codos ligeramente al frente de la barra",
      ],
      dos: [
        "Empuja la barra recta hacia arriba",
        "Glúteos y core apretados (sin arquear lumbar)",
        "Cabeza pasa entre brazos al final",
      ],
      donts: [
        "Usar piernas (eso es push press)",
        "Hyperextender la lumbar para empujar",
        "Empujar la barra hacia adelante",
      ],
    },
    commonMistakes: [
      {
        title: "Hyperextensión lumbar",
        description: "Compensas falta de movilidad de hombros con arco.",
        fixCue: "Costillas abajo, glúteos apretados",
      },
    ],
    progressions: [
      { name: "Strict press con dumbbells", level: "beginner" },
      { name: "Strict press barra vacía", level: "intermediate" },
      { name: "Strict press 0.6x BW+", level: "advanced" },
    ],
    musclesWorked: ["shoulders", "triceps", "core", "upper back"],
    difficulty: 3,
  },
  "handstand-push-up": {
    cues: {
      setup: [
        "Manos a ancho de hombros frente a la pared",
        "Cuerpo vertical contra el muro, talones tocando",
      ],
      dos: [
        "Cabeza forma triángulo con las manos en el bottom",
        "Empuja con shrug agresivo al final",
        "Mantén core apretado todo el rango",
      ],
      donts: [
        "Bajar sin control hasta golpear la cabeza",
        "Bajar solo la cabeza sin que el cuerpo descienda",
        "Codos abiertos en T",
      ],
    },
    commonMistakes: [
      {
        title: "Plancha en vez de vertical",
        description: "Cadera adelante en vez de stack vertical.",
        fixCue: "Glúteos apretados, costillas abajo, talones a la pared",
      },
      {
        title: "No completar el rango (cabeza no toca)",
        fixCue: "Triángulo cabeza-manos, baja completo",
      },
    ],
    progressions: [
      {
        name: "Pike push-up con pies en caja",
        level: "beginner",
        description: "Misma mecánica sin invertir el cuerpo completo.",
      },
      {
        name: "Wall-walk + hold",
        level: "beginner",
      },
      {
        name: "HSPU con abmats (rango parcial)",
        level: "intermediate",
      },
      {
        name: "Strict HSPU full ROM contra pared",
        level: "advanced",
      },
      {
        name: "Freestanding HSPU",
        level: "advanced",
      },
    ],
    musclesWorked: ["shoulders", "triceps", "core", "traps"],
    difficulty: 5,
  },
  "kettlebell-swing": {
    cues: {
      setup: [
        "Pies un poco más amplios que la cadera",
        "KB al frente entre los pies",
      ],
      dos: [
        "Hip hinge: cadera atrás, no squat",
        "KB pasa entre las piernas atrás (no entre rodillas)",
        "Drive con cadera explosivo, brazos relajados",
      ],
      donts: [
        "Subir el KB con los brazos (no es press frontal)",
        "Hacer squat en vez de hinge",
        "Hyperextender la lumbar al final",
      ],
    },
    commonMistakes: [
      {
        title: "Squat swing en vez de hip hinge",
        fixCue: "Cadera atrás, rodillas firmes pero no squat",
      },
      {
        title: "KB se aleja del cuerpo en el back swing",
        fixCue: "Codos cerca del torso, KB pasa alto entre las piernas",
      },
    ],
    progressions: [
      {
        name: "Hip hinge con barra ligera",
        level: "beginner",
        description: "Aprender el patrón sin el peso oscilante.",
      },
      { name: "Russian swing (hasta el pecho)", level: "beginner" },
      {
        name: "American swing (overhead) con KB ligero",
        level: "intermediate",
      },
      { name: "American swing RX (24kg / 16kg)", level: "advanced" },
    ],
    musclesWorked: ["glutes", "hamstrings", "core", "shoulders", "lats"],
    difficulty: 3,
  },
  burpee: {
    cues: {
      setup: ["De pie, pies a la altura de hombros"],
      dos: [
        "Baja a plancha controlado",
        "Pecho y muslos tocan el piso",
        "Salta con dos pies y aplaude arriba",
      ],
      donts: [
        "Saltar uno solo pie a la vez",
        "Quitar el pecho/muslos del piso al subir",
      ],
    },
    commonMistakes: [
      {
        title: "Cadera cayendo en plancha",
        fixCue: "Activa core como una tabla rígida",
      },
    ],
    progressions: [
      {
        name: "Step-down burpee (sin saltar)",
        level: "beginner",
      },
      { name: "Burpee estándar", level: "intermediate" },
      { name: "Burpee bar facing", level: "advanced" },
    ],
    musclesWorked: ["full body", "core", "shoulders", "quads"],
    difficulty: 3,
  },
  "wall-ball": {
    cues: {
      setup: [
        "Pies a la altura de hombros frente al wall",
        "Pelota apoyada en el pecho",
      ],
      dos: [
        "Squat completo (cadera bajo rodilla)",
        "Lanza con piernas + brazos en un solo movimiento",
        "Apunta a la marca/altura objetivo",
      ],
      donts: ["Hacer squat parcial", "Empujar solo con los brazos"],
    },
    commonMistakes: [
      {
        title: "Pelota cayendo en la cara",
        fixCue: "Manos sueltas pero atentas, recibe controlada",
      },
    ],
    progressions: [
      { name: "Pelota ligera 4kg", level: "beginner" },
      { name: "Wall ball estándar 9kg / 6kg", level: "intermediate" },
      { name: "Wall ball heavy 14kg+", level: "advanced" },
    ],
    musclesWorked: ["quads", "glutes", "shoulders", "core"],
    difficulty: 2,
  },
};

/**
 * Creates/upserts the 50 standard CrossFit movements for a given tenantId.
 * Uses isStandard=true flag. Idempotent — safe to run multiple times.
 *
 * CLI-only wrapper: instantiates a PrismaClient. For server-side use inside
 * transactions (e.g. signup), call seedDefaultMovements() from
 * src/server/seed-defaults.ts with a transaction client.
 */
export async function seedStandardMovements(tenantId: string): Promise<void> {
  const prisma = new PrismaClient();
  try {
    console.log(
      `  Seeding ${STANDARD_MOVEMENTS.length} standard movements for tenant ${tenantId}...`,
    );
    for (const mv of STANDARD_MOVEMENTS) {
      const enrich = MOVEMENT_ENRICHMENTS[mv.slug];
      const enrichmentData: Record<string, unknown> = {};
      let hasContent = false;
      if (enrich) {
        if (enrich.cues) {
          enrichmentData.cues = enrich.cues;
          hasContent = true;
        }
        if (enrich.commonMistakes) {
          enrichmentData.commonMistakes = enrich.commonMistakes;
          hasContent = true;
        }
        if (enrich.progressions) {
          enrichmentData.progressions = enrich.progressions;
          hasContent = true;
        }
        if (enrich.musclesWorked)
          enrichmentData.musclesWorked = enrich.musclesWorked;
        if (enrich.difficulty != null)
          enrichmentData.difficulty = enrich.difficulty;
      }
      if (hasContent) {
        enrichmentData.contentSource = "STANDARD_SEED";
      }
      await prisma.movement.upsert({
        where: { tenantId_slug: { tenantId, slug: mv.slug } },
        update: {
          name: mv.name,
          category: mv.category,
          standardDescription: mv.standardDescription,
          videoUrl: mv.videoUrl,
          equipment: mv.equipment,
          isStandard: true,
          ...enrichmentData,
        },
        create: {
          tenantId,
          slug: mv.slug,
          name: mv.name,
          category: mv.category,
          isStandard: true,
          standardDescription: mv.standardDescription,
          videoUrl: mv.videoUrl,
          equipment: mv.equipment,
          ...enrichmentData,
        },
      });
    }
    console.log(`  ✅ ${STANDARD_MOVEMENTS.length} movimientos seeded`);
  } finally {
    await prisma.$disconnect();
  }
}
