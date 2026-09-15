/**
 * The standard movement catalogue, as pure data.
 *
 * Extracted from `prisma/seed-movements.ts` so it can be asserted on without
 * pulling in `PrismaClient`: `tests/unit/atleta-leftovers-seed-strings.test.ts`
 * imports this module and fails on English tokens.
 *
 * Why that test exists (audit 2026-09-15): the Thruster detail page printed
 * equipment "Barbell / Plates", muscles "Quads, Glutes, Shoulders, Core,
 * Triceps" and a description starting "Front squat into overhead press" inside
 * otherwise Spanish copy, because those exact strings are what the seed wrote
 * to the DB. `src/app/atleta/movimientos/_lib/movement-i18n.ts` translates them
 * at read time — that mapper STAYS, it is what protects rows seeded months ago
 * — but a fresh seed now writes Spanish in the first place.
 *
 * CrossFit vocabulary that Mexican boxes genuinely speak (WOD, PR, RX, snatch,
 * clean, jerk, thruster, burpee, kipping, hollow, ROM, time cap, erg…) is left
 * alone on purpose: translating it would make the copy read as foreign, not
 * local. What is translated is equipment, anatomy, and the generator's own
 * field labels.
 */
import type { MovementCategory } from "@prisma/client";

export type StandardMovement = {
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
      "Front squat que encadena directo a un press sobre la cabeza, en un solo movimiento continuo. Se mide en peso (kg). Claves RX: bar en rack frontal, codos altos en squat, presiona explosivo desde el fondo.",
    videoUrl: "https://www.youtube.com/embed/L219ltL15zk",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "clean",
    name: "Clean",
    category: "OLYMPIC",
    standardDescription:
      "Pull explosivo del suelo a rack frontal. Se mide en peso (kg). Claves RX: extensión triple completa, drop rápido bajo la barra, codos altos en el catch.",
    videoUrl: "https://www.youtube.com/embed/EKRiW9Yt3Ps",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "snatch",
    name: "Snatch",
    category: "OLYMPIC",
    standardDescription:
      "Levantamiento desde el suelo hasta overhead en un movimiento continuo. Se mide en peso (kg). Claves RX: agarre amplio, barra cerca del cuerpo, recibir en squat profundo.",
    videoUrl: "https://www.youtube.com/embed/9xQp2sldyts",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "clean-and-jerk",
    name: "Clean and Jerk",
    category: "OLYMPIC",
    standardDescription:
      "Combinación de clean + jerk. Se mide en peso (kg). Claves RX: recuperar bien del clean antes del jerk, posición de split firme.",
    videoUrl: "https://www.youtube.com/embed/5EiLkyeCGp8",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "power-clean",
    name: "Power Clean",
    category: "OLYMPIC",
    standardDescription:
      "Clean recibido por encima del paralelo. Se mide en peso (kg). Claves RX: extensión triple, recibir en quarter squat.",
    videoUrl: "https://www.youtube.com/embed/IwjMiEEtbMo",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "dumbbell-snatch",
    name: "Dumbbell Snatch",
    category: "OLYMPIC",
    standardDescription:
      "Snatch con mancuerna alternando brazos. Se mide en reps o peso. Claves RX: espalda baja neutral, rotación del hombro al final.",
    videoUrl: "https://www.youtube.com/embed/9rRMFYPdYhg",
    equipment: ["Mancuerna"],
  },
  {
    slug: "dumbbell-clean",
    name: "Dumbbell Clean",
    category: "OLYMPIC",
    standardDescription:
      "Clean con mancuernas (ambas manos). Se mide en reps o peso. Claves RX: mismo patrón que barbell clean, mantener core.",
    videoUrl: "https://www.youtube.com/embed/CUaxieWW0tw",
    equipment: ["Mancuerna"],
  },
  {
    slug: "turkish-get-up",
    name: "Turkish Get-Up",
    category: "OLYMPIC",
    standardDescription:
      "Levantamiento desde el suelo hasta de pie con kettlebell en overhead. Se mide en peso (kg). Claves RX: brazo perpendicular al suelo todo el movimiento, lento y controlado.",
    videoUrl: "https://www.youtube.com/embed/0bWRPC49-KI",
    equipment: ["Kettlebell"],
  },

  // STRENGTH
  {
    slug: "push-press",
    name: "Push Press",
    category: "STRENGTH",
    standardDescription:
      "Press overhead con impulso de piernas (dip & drive). Se mide en peso (kg). Claves RX: dip recto, drive vertical, no hiperextiendas la espalda al cerrar arriba.",
    videoUrl: "https://www.youtube.com/embed/iaBVSJm78ko",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "push-jerk",
    name: "Push Jerk",
    category: "STRENGTH",
    standardDescription:
      "Jerk con recepción en press position (no split). Se mide en peso (kg). Claves RX: drop bajo la barra, cierra los brazos antes de recuperar.",
    videoUrl: "https://www.youtube.com/embed/V-hKuAfWNUw",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "deadlift",
    name: "Deadlift",
    category: "STRENGTH",
    standardDescription:
      "Levantamiento desde el suelo hasta extensión completa de cadera. Se mide en peso (kg). Claves RX: espalda neutral, barra sobre el medio del pie, empujar el suelo.",
    videoUrl: "https://www.youtube.com/embed/op9kVnSso6Q",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "back-squat",
    name: "Back Squat",
    category: "STRENGTH",
    standardDescription:
      "Sentadilla con barra en posición posterior (high bar). Se mide en peso (kg). Claves RX: profundidad: el pliegue de la cadera por debajo de la rodilla, torso vertical.",
    videoUrl: "https://www.youtube.com/embed/ultWZbUMPL8",
    equipment: ["Barra", "Discos", "Rack"],
  },
  {
    slug: "front-squat",
    name: "Front Squat",
    category: "STRENGTH",
    standardDescription:
      "Sentadilla con barra en rack frontal. Se mide en peso (kg). Claves RX: codos altos para no perder la barra, torso muy vertical.",
    videoUrl: "https://www.youtube.com/embed/uYumuL_G_V0",
    equipment: ["Barra", "Discos", "Rack"],
  },
  {
    slug: "overhead-squat",
    name: "Overhead Squat",
    category: "STRENGTH",
    standardDescription:
      "Sentadilla con barra en overhead (agarre snatch). Se mide en peso (kg). Claves RX: activa el overhead, piernas abiertas.",
    videoUrl: "https://www.youtube.com/embed/RD_vUnqwqqI",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "bench-press",
    name: "Bench Press",
    category: "STRENGTH",
    standardDescription:
      "Press en banco plano. Se mide en peso (kg). Claves RX: retrae las escápulas, pies en el suelo, la barra viaja en curva hacia el pecho.",
    videoUrl: "https://www.youtube.com/embed/vcBig73ojpE",
    equipment: ["Barra", "Discos", "Banca"],
  },
  {
    slug: "strict-press",
    name: "Strict Press",
    category: "STRENGTH",
    standardDescription:
      "Press overhead estricto (sin impulso de piernas). Se mide en peso (kg). Claves RX: glúteos apretados, no hiperextiendas la lumbar.",
    videoUrl: "https://www.youtube.com/embed/2yjwXTZQDDI",
    equipment: ["Barra", "Discos"],
  },
  {
    slug: "farmers-carry",
    name: "Farmers Carry",
    category: "STRENGTH",
    standardDescription:
      "Caminata cargando peso en ambas manos. Se mide en distancia (m) o peso (kg). Claves RX: hombros atrás y abajo, pasos cortos y rápidos.",
    videoUrl: "https://www.youtube.com/embed/cBv3NcxqhPM",
    equipment: ["Kettlebell", "Mancuerna"],
  },

  // GYMNASTICS
  {
    slug: "pull-up",
    name: "Pull-up",
    category: "GYMNASTICS",
    standardDescription:
      "Jalón en barra fija hasta que el mentón supere la barra. Se mide en reps. Claves RX: recorrido completo, la barbilla claramente por encima de la barra.",
    videoUrl: "https://www.youtube.com/embed/eGo4IYlbE5g",
    equipment: ["Barra de dominadas"],
  },
  {
    slug: "kipping-pull-up",
    name: "Kipping Pull-up",
    category: "GYMNASTICS",
    standardDescription:
      "Pull-up con kip (movimiento de cadera para generar momentum). Se mide en reps. Claves RX: ciclo hollow-arch, sin jalar con un solo brazo.",
    videoUrl: "https://www.youtube.com/embed/JrHciIJQMBQ",
    equipment: ["Barra de dominadas"],
  },
  {
    slug: "chest-to-bar",
    name: "Chest-to-Bar",
    category: "GYMNASTICS",
    standardDescription:
      "Pull-up donde el pecho toca la barra. Se mide en reps. Claves RX: el pecho (no la barbilla) debe hacer contacto con la barra.",
    videoUrl: "https://www.youtube.com/embed/MzmJmRGFVDo",
    equipment: ["Barra de dominadas"],
  },
  {
    slug: "muscle-up-ring",
    name: "Muscle-up (Ring)",
    category: "GYMNASTICS",
    standardDescription:
      "Transición de pull a dip en anillos. Se mide en reps. Claves RX: false grip, jalón agresivo, salida en press firme.",
    videoUrl: "https://www.youtube.com/embed/6nQu-Y8Plbk",
    equipment: ["Anillas"],
  },
  {
    slug: "muscle-up-bar",
    name: "Muscle-up (Bar)",
    category: "GYMNASTICS",
    standardDescription:
      "Transición de pull a dip en barra fija. Se mide en reps. Claves RX: cadera a la barra en el jalón, salida limpia.",
    videoUrl: "https://www.youtube.com/embed/P099n4qjKy0",
    equipment: ["Barra de dominadas"],
  },
  {
    slug: "toes-to-bar",
    name: "Toes-to-Bar",
    category: "GYMNASTICS",
    standardDescription:
      "Desde colgado en barra, llevar los pies hasta tocar la barra. Se mide en reps. Claves RX: ambos pies tocan simultáneamente.",
    videoUrl: "https://www.youtube.com/embed/_03pCKOv4l4",
    equipment: ["Barra de dominadas"],
  },
  {
    slug: "handstand-push-up",
    name: "Handstand Push-up",
    category: "GYMNASTICS",
    standardDescription:
      "Press de hombros en posición invertida contra pared. Se mide en reps. Claves RX: la cabeza toca el piso: ése es el recorrido completo.",
    videoUrl: "https://www.youtube.com/embed/IHGhp3pW6FE",
    equipment: ["Pared"],
  },
  {
    slug: "handstand-walk",
    name: "Handstand Walk",
    category: "GYMNASTICS",
    standardDescription:
      "Caminata en posición invertida. Se mide en distancia (m). Claves RX: hombros abiertos, mira al frente, pasos pequeños.",
    videoUrl: "https://www.youtube.com/embed/FdgJ9jZIT-Q",
    equipment: [],
  },
  {
    slug: "ring-dip",
    name: "Ring Dip",
    category: "GYMNASTICS",
    standardDescription:
      "Dip en anillos con full lockout. Se mide en reps. Claves RX: gira las anillas hacia fuera arriba, sin inclinar el pecho de más.",
    videoUrl: "https://www.youtube.com/embed/YFimRjwqCH8",
    equipment: ["Anillas"],
  },
  {
    slug: "bar-dip",
    name: "Bar Dip",
    category: "GYMNASTICS",
    standardDescription:
      "Dip en barras paralelas. Se mide en reps. Claves RX: recorrido completo: el hombro por debajo del codo en el fondo.",
    videoUrl: "https://www.youtube.com/embed/eERwCQHZqfA",
    equipment: ["Barras paralelas"],
  },
  {
    slug: "rope-climb",
    name: "Rope Climb",
    category: "GYMNASTICS",
    standardDescription:
      "Subida de cuerda. Se mide en reps (subidas). Claves RX: S-wrap con los pies para agarre; usa J-hook para ganar eficiencia.",
    videoUrl: "https://www.youtube.com/embed/E2hWMlqxBaw",
    equipment: ["Cuerda"],
  },
  {
    slug: "pistol-squat",
    name: "Pistol Squat",
    category: "GYMNASTICS",
    standardDescription:
      "Sentadilla a una pierna. Se mide en reps (cada pierna). Claves RX: pierna libre extendida, tocar el piso marca la profundidad completa.",
    videoUrl: "https://www.youtube.com/embed/vq5-vdgJc0I",
    equipment: [],
  },
  {
    slug: "hollow-rock",
    name: "Hollow Rock",
    category: "GYMNASTICS",
    standardDescription:
      "Posición hollow mantenida mientras se balancea. Se mide en reps. Claves RX: espalda baja pegada al piso, piernas y brazos extendidos.",
    videoUrl: "https://www.youtube.com/embed/SfkuOb_1GK8",
    equipment: [],
  },
  {
    slug: "jumping-pull-up",
    name: "Jumping Pull-up",
    category: "GYMNASTICS",
    standardDescription:
      "Pull-up con impulso de piernas desde el suelo. Se mide en reps. Claves RX: barbilla claramente por encima de la barra, control en el descenso.",
    videoUrl: "https://www.youtube.com/embed/oBIFjk3cSQ4",
    equipment: ["Barra de dominadas"],
  },
  {
    slug: "knee-raise",
    name: "Knee Raise",
    category: "GYMNASTICS",
    standardDescription:
      "Desde colgado en barra, llevar las rodillas al pecho. Se mide en reps. Escalada de toes-to-bar.",
    videoUrl: "https://www.youtube.com/embed/lW4onyuCkzA",
    equipment: ["Barra de dominadas"],
  },
  {
    slug: "bar-muscle-up",
    name: "Bar Muscle-up",
    category: "GYMNASTICS",
    standardDescription:
      "Muscle-up en barra fija. Se mide en reps. Claves RX: jalón agresivo de cadera a la barra, salida limpia en press.",
    videoUrl: "https://www.youtube.com/embed/P099n4qjKy0",
    equipment: ["Barra de dominadas"],
  },

  // MONOSTRUCTURAL
  {
    slug: "run",
    name: "Run",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Carrera. Se mide en tiempo (s) o distancia (m). Claves RX: pisa con el medio del pie, cadencia alta, hombros relajados.",
    videoUrl: "https://www.youtube.com/embed/y1wnFWIisq8",
    equipment: [],
  },
  {
    slug: "row",
    name: "Row (Concept2)",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Remo en ergómetro Concept2. Se mide en tiempo (s) o distancia (m). Claves RX: primero empuja con piernas, luego reclina, al final brazos.",
    videoUrl: "https://www.youtube.com/embed/zQ82RYIFLN4",
    equipment: ["Remadora"],
  },
  {
    slug: "bike",
    name: "Bike (Assault)",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Bike ergómetro (Assault/Echo). Se mide en calorías o tiempo. Claves RX: 80-85 rpm, empuja y jala los manerales.",
    videoUrl: "https://www.youtube.com/embed/mY9ihujdkc0",
    equipment: ["Bicicleta de aire"],
  },
  {
    slug: "ski-erg",
    name: "Ski Erg",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Ski ergómetro. Se mide en calorías o tiempo. Claves RX: empujar con el cuerpo hacia abajo, no solo los brazos.",
    videoUrl: "https://www.youtube.com/embed/B0lIgT5PHc8",
    equipment: ["Ski erg"],
  },
  {
    slug: "double-under",
    name: "Double Under",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Cuerda pasa dos veces por salto. Se mide en reps. Claves RX: muñecas rápidas, salto recto sin patear atrás.",
    videoUrl: "https://www.youtube.com/embed/82IdFQ9BmWw",
    equipment: ["Cuerda de saltar"],
  },
  {
    slug: "single-under",
    name: "Single Under",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Salto de cuerda estándar (una vuelta por salto). Se mide en reps. Escalada de double-under.",
    videoUrl: "https://www.youtube.com/embed/EwrFMvxMSkk",
    equipment: ["Cuerda de saltar"],
  },

  // ACCESSORY
  {
    slug: "air-squat",
    name: "Air Squat",
    category: "ACCESSORY",
    standardDescription:
      "Sentadilla con peso corporal. Se mide en reps. Claves RX: cadera por debajo de la rodilla, rodillas en línea con pies.",
    videoUrl: "https://www.youtube.com/embed/C_VtOYc6j5c",
    equipment: [],
  },
  {
    slug: "push-up",
    name: "Push-up",
    category: "ACCESSORY",
    standardDescription:
      "Fondos en el suelo. Se mide en reps. Claves RX: pecho y muslos tocan el piso, brazos completamente extendidos arriba.",
    videoUrl: "https://www.youtube.com/embed/IODxDxX7oi4",
    equipment: [],
  },
  {
    slug: "burpee",
    name: "Burpee",
    category: "ACCESSORY",
    standardDescription:
      "Combinación de push-up y salto vertical. Se mide en reps. Claves RX: pecho y muslos al piso, salta y junta las palmas por encima de la cabeza.",
    videoUrl: "https://www.youtube.com/embed/dZgVxmf6jkA",
    equipment: [],
  },
  {
    slug: "box-jump",
    name: "Box Jump",
    category: "ACCESSORY",
    standardDescription:
      "Salto a cajón despegando y cayendo con los dos pies. Se mide en reps. Claves RX: extensión completa de cadera arriba.",
    videoUrl: "https://www.youtube.com/embed/52r_Ul5k03g",
    equipment: ["Cajón"],
  },
  {
    slug: "wall-ball",
    name: "Wall Ball",
    category: "ACCESSORY",
    standardDescription:
      "Squat + lanzamiento de balón a objetivo. Se mide en reps. Claves RX: blanco a ~3 m, recibe el balón bajando en squat fluido.",
    videoUrl: "https://www.youtube.com/embed/fpUD0mcFp_0",
    equipment: ["Balón medicinal", "Blanco en la pared"],
  },
  {
    slug: "kettlebell-swing",
    name: "Kettlebell Swing",
    category: "ACCESSORY",
    standardDescription:
      "Swing de kettlebell. American (por encima de la cabeza) o Russian (a la altura de los ojos). Se mide en reps. Claves RX: bisagra de cadera (no squat), explosión de cadera.",
    videoUrl: "https://www.youtube.com/embed/YSxHifyI6s8",
    equipment: ["Kettlebell"],
  },
  {
    slug: "lunge",
    name: "Lunge",
    category: "ACCESSORY",
    standardDescription:
      "Zancada (peso corporal o cargado). Se mide en reps o distancia. Claves RX: rodilla trasera cerca del suelo, torso vertical.",
    videoUrl: "https://www.youtube.com/embed/JRh6_4rq-b8",
    equipment: [],
  },
  {
    slug: "sit-up",
    name: "Sit-up",
    category: "ACCESSORY",
    standardDescription:
      "Abdominal. Se mide en reps. Claves RX: posición de mariposa (plantas de los pies juntas), manos tocan el suelo tras la cabeza.",
    videoUrl: "https://www.youtube.com/embed/VIZX2Ru9qU8",
    equipment: [],
  },
  {
    slug: "ghd-sit-up",
    name: "GHD Sit-up",
    category: "ACCESSORY",
    standardDescription:
      "Abdominal en máquina GHD (Glute Ham Developer). Se mide en reps. Claves RX: hiperextensión controlada, manos a los tobillos.",
    videoUrl: "https://www.youtube.com/embed/1pbZ8mX2D1U",
    equipment: ["GHD"],
  },
  {
    slug: "sled-push",
    name: "Sled Push",
    category: "ACCESSORY",
    standardDescription:
      "Empuje de trineo cargado. Se mide en distancia (m) o tiempo. Claves RX: inclinación 45°, pasos cortos y explosivos.",
    videoUrl: "https://www.youtube.com/embed/F7otn_5JdqA",
    equipment: ["Trineo"],
  },
  {
    slug: "sled-pull",
    name: "Sled Pull",
    category: "ACCESSORY",
    standardDescription:
      "Jalón de trineo cargado. Se mide en distancia (m). Claves RX: recárgate hacia atrás, pasos potentes.",
    videoUrl: "https://www.youtube.com/embed/cy1gCkC6InY",
    equipment: ["Trineo", "Arnés"],
  },
  {
    slug: "devils-press",
    name: "Devil's Press",
    category: "ACCESSORY",
    standardDescription:
      "Burpee + dumbbell snatch (ambos brazos simultáneamente). Se mide en reps. Claves RX: snatch explosivo desde el burpee.",
    videoUrl: "https://www.youtube.com/embed/cBGQrgovLFM",
    equipment: ["Mancuerna"],
  },
  {
    slug: "man-maker",
    name: "Man Maker",
    category: "ACCESSORY",
    standardDescription:
      "Push-up + row + row + thruster con mancuernas. Se mide en reps. Claves RX: movimiento fluido, core activo durante el push-up.",
    videoUrl: "https://www.youtube.com/embed/iMNnvhg1JcM",
    equipment: ["Mancuerna"],
  },
];

export type MovementEnrichment = {
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
    musclesWorked: ["Cuádriceps", "Glúteos", "Hombros", "Core", "Tríceps"],
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
    musclesWorked: [
      "Isquiotibiales",
      "Glúteos",
      "Trapecios",
      "Cuádriceps",
      "Core",
    ],
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
    musclesWorked: [
      "Hombros",
      "Trapecios",
      "Glúteos",
      "Core",
      "Isquiotibiales",
    ],
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
    musclesWorked: [
      "Isquiotibiales",
      "Glúteos",
      "Espalda baja",
      "Dorsales",
      "Core",
    ],
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
    musclesWorked: ["Dorsales", "Bíceps", "Core", "Deltoides posteriores"],
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
    musclesWorked: ["Cuádriceps", "Glúteos", "Isquiotibiales", "Core"],
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
    musclesWorked: [
      "Cuádriceps",
      "Glúteos",
      "Isquiotibiales",
      "Core",
      "Espalda baja",
    ],
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
    musclesWorked: ["Cuádriceps", "Core", "Espalda alta", "Glúteos"],
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
    musclesWorked: ["Pecho", "Tríceps", "Hombros", "Core"],
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
    musclesWorked: ["Hombros", "Tríceps", "Cuádriceps", "Core"],
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
    musclesWorked: ["Hombros", "Tríceps", "Core", "Espalda alta"],
    difficulty: 3,
  },
  "double-under": {
    cues: {
      setup: [
        "Cuerda ajustada: al pisarla, los mangos llegan a la axila",
        "Pies juntos o ligeramente separados, cuerpo recto",
      ],
      dos: [
        "Muñecas hacen el trabajo — giro rápido y pequeño",
        "Salto neutro: rodillas ligeramente dobladas, cabeza en línea",
        "Ritmo constante: no saltar más alto, girar más rápido",
      ],
      donts: [
        "Patear hacia atrás (donkey kick) — acorta el ciclo",
        "Doblar el torso hacia adelante",
        "Girar los brazos en vez de las muñecas",
      ],
    },
    commonMistakes: [
      {
        title: "Donkey kick",
        description:
          "Los talones van hacia atrás al saltar, enredando la cuerda.",
        fixCue: "Aprieta glúteos, mantén piernas rectas hacia abajo",
      },
      {
        title: "Salto exagerado",
        description:
          "Intentar ganar tiempo subiendo más alto en vez de girar más rápido.",
        fixCue: "Mismo salto que en single-under, solo más rápido de muñecas",
      },
    ],
    progressions: [
      {
        name: "Single-under consistente (50+ sin fallo)",
        level: "beginner",
        description:
          "Establece ritmo y postura base antes de introducir el doble giro.",
      },
      {
        name: "Single-single-double (1-1-2)",
        level: "beginner",
        description:
          "Patrón de transición: dos singles normales y un double-under. Permite sentir el doble giro sin perder el ritmo.",
      },
      {
        name: "Double-under en series cortas (5-10 consecutivos)",
        level: "intermediate",
        description:
          "Dobles consecutivos con pequeñas pausas de recuperación entre sets.",
      },
      {
        name: "Double-under en series de 30+ consecutivos",
        level: "advanced",
        description:
          "Ritmo sostenido sin interrupciones. Velocidad de muñeca estable.",
      },
    ],
    musclesWorked: ["Pantorrillas", "Core", "Hombros", "Antebrazos"],
    difficulty: 3,
  },
  "toes-to-bar": {
    cues: {
      setup: [
        "Colgado en barra con agarre prono, hombros activos hacia abajo",
        "Cuerpo en posición hollow antes de iniciar el kip",
      ],
      dos: [
        "Activar el ciclo hollow-arch para generar momentum",
        "Ambos pies tocan la barra simultáneamente",
        "Mirar ligeramente al frente, no hacia arriba",
      ],
      donts: [
        "Llevar solo un pie (barre a la barra con piernas separadas)",
        "Balancear sin control en el kip",
        "Soltar los hombros al recibirte — hombros siempre activos",
      ],
    },
    commonMistakes: [
      {
        title: "Piernas separadas al tocar la barra",
        description:
          "Solo una pierna llega. El estándar CrossFit exige que ambos pies toquen juntos.",
        fixCue: "Junta los talones antes de subir",
      },
      {
        title: "Kip sin hollow-arch",
        description:
          "El balanceo viene de las piernas sueltas, no del ciclo de cuerpo.",
        fixCue:
          "Empuja la barra lejos durante el arch, luego recógela en hollow",
      },
    ],
    progressions: [
      {
        name: "Dead hang knee raise",
        level: "beginner",
        description:
          "Desde colgado, llevar las rodillas al pecho de forma estricta. Activa el core y acostumbra los hombros al colgado activo.",
      },
      {
        name: "Kipping knee raise",
        level: "beginner",
        description:
          "Knee raise con ciclo hollow-arch. Introduce el kip antes de exigir el ROM completo.",
      },
      {
        name: "Knees-to-elbows",
        level: "intermediate",
        description:
          "Las rodillas tocan los codos. Progresión intermedia que exige más flexión de cadera.",
      },
      {
        name: "Toes-to-bar kipping",
        level: "advanced",
        description:
          "Ambos pies tocan la barra simultáneamente con kip eficiente. Estándar CrossFit completo.",
      },
    ],
    musclesWorked: ["Core", "Flexores de cadera", "Dorsales", "Antebrazos"],
    difficulty: 4,
  },
  "ring-dip": {
    cues: {
      setup: [
        "Anillas a la altura de las caderas, brazos extendidos al tope",
        "Turnout en la posición de soporte: anillas rotadas hacia afuera",
      ],
      dos: [
        "Mantén el turnout (anillas rotando hacia afuera) durante todo el movimiento",
        "Baja con control: pecho hacia adelante, codos hacia atrás",
        "Empuja a lockout completo arriba con shrug al final",
      ],
      donts: [
        "Dejar que las anillas se abran demasiado al bajar",
        "Bajar con torso completamente vertical (convierte en tricep dip puro)",
        "Rebotar en el bottom sin control",
      ],
    },
    commonMistakes: [
      {
        title: "Anillas inestables — sin turnout",
        description:
          "Sin rotación, el hombro queda en posición vulnerable y la fuerza es menor.",
        fixCue: "Gira las muñecas hacia afuera activamente al subir",
      },
      {
        title: "Rango incompleto",
        description: "El hombro no baja por debajo del codo.",
        fixCue: "Pecho hacia adelante en el bottom, hombro por debajo del codo",
      },
    ],
    progressions: [
      {
        name: "Ring support hold (soporte estático)",
        level: "beginner",
        description:
          "Mantener el soporte arriba con lockout y turnout por 10-30 seg. Construye estabilidad de hombro.",
      },
      {
        name: "Bar dip estricto",
        level: "beginner",
        description:
          "Dip en barras paralelas para construir fuerza sin la inestabilidad de anillas.",
      },
      {
        name: "Ring dip asistido con bandas",
        level: "intermediate",
        description:
          "Banda elástica bajo los pies reduce el porcentaje de peso corporal. Permite sentir el turnout.",
      },
      {
        name: "Ring dip estricto sin asistencia",
        level: "advanced",
        description:
          "Dip completo en anillas: turnout, ROM completo, lockout limpio arriba.",
      },
    ],
    musclesWorked: ["Tríceps", "Pecho", "Hombros", "Core"],
    difficulty: 4,
  },
  "pistol-squat": {
    cues: {
      setup: [
        "De pie en una pierna, pierna libre extendida al frente",
        "Brazos al frente para contrabalancear",
      ],
      dos: [
        "Baja con control — el trasero busca el talón de la pierna de apoyo",
        "Pierna libre extendida y paralela al suelo en el bottom",
        "Sube empujando el suelo con el talón",
      ],
      donts: [
        "Dejar que la rodilla colapse hacia adentro",
        "Inclinarte excesivamente hacia adelante perdiendo el torso",
        "Bajar sin control y rebotar en el bottom",
      ],
    },
    commonMistakes: [
      {
        title: "Rodilla cayendo hacia adentro (valgus)",
        fixCue: "Empuja la rodilla hacia afuera en línea con el pie",
      },
      {
        title: "Talón se despega en el bottom",
        description: "Falta movilidad de tobillo o cadera.",
        fixCue:
          "Trabaja dorsiflexión de tobillo; prueba sobre una superficie elevada",
      },
    ],
    progressions: [
      {
        name: "Box pistol (sentadilla a caja baja)",
        level: "beginner",
        description:
          "Sentadilla a una pierna bajando a una caja o banco. Elimina el miedo al fondo y controla el rango.",
      },
      {
        name: "Pistol asistido con banda o soporte",
        level: "beginner",
        description:
          "Sostener una banda del techo o la barra del rack para asistencia de balance. Permite el patrón completo con apoyo.",
      },
      {
        name: "Pistol en superfice elevada (déficit reducido)",
        level: "intermediate",
        description:
          "De pie sobre un pequeño step: la pierna libre puede colgar sin tocar el suelo, aliviando la exigencia de movilidad.",
      },
      {
        name: "Pistol squat completo sin asistencia",
        level: "advanced",
        description:
          "Desde el suelo, descenso controlado hasta el fondo y subida sin apoyo. Ambas piernas.",
      },
    ],
    musclesWorked: [
      "Cuádriceps",
      "Glúteos",
      "Core",
      "Flexores de cadera",
      "Pantorrillas",
    ],
    difficulty: 5,
  },
  "handstand-walk": {
    cues: {
      setup: [
        "Kick-up controlado a la pared para calibrar posición invertida",
        "Manos a ancho de hombros, dedos abiertos para grip",
      ],
      dos: [
        "Hombros abiertos — empuja el suelo activamente",
        "Mirada al suelo entre las manos",
        "Pasos pequeños y rápidos con alternancia de manos",
      ],
      donts: [
        "Mirar hacia adelante — pierde alineación",
        "Pasos grandes — desestabilizan más que ayudan",
        "Perder la tensión del core en posición invertida",
      ],
    },
    commonMistakes: [
      {
        title: "Banana-back (hiperextensión lumbar)",
        description:
          "La cadera cae adelante del stack vertical, hace la caminata ineficiente.",
        fixCue: "Costillas abajo, glúteos apretados, cuerpo en línea recta",
      },
      {
        title: "Mirar al frente en vez del suelo",
        fixCue: "Ojos entre las manos — el cuello sigue al torso",
      },
    ],
    progressions: [
      {
        name: "Wall walk (caminar manos hacia la pared)",
        level: "beginner",
        description:
          "Desde el suelo en push-up, caminar las manos hacia la pared a posición invertida y bajar. Introduce la inversión de forma segura.",
      },
      {
        name: "Handstand hold contra pared (10-30 seg)",
        level: "beginner",
        description:
          "Mantener el balance invertido contra la pared trabajando alineación y tensión corporal.",
      },
      {
        name: "Handstand shoulder taps contra pared",
        level: "intermediate",
        description:
          "Desde el handstand en pared, levantar una mano y tocar el hombro alternando. Introduce el balance unilateral.",
      },
      {
        name: "Handstand walk freestanding 5m+",
        level: "advanced",
        description:
          "Caminata sin apoyo de pared. Distancia mínima estándar en competencia: 5m.",
      },
    ],
    musclesWorked: [
      "Hombros",
      "Core",
      "Tríceps",
      "Flexores de muñeca",
      "Trapecios",
    ],
    difficulty: 5,
  },
  "muscle-up-ring": {
    cues: {
      setup: [
        "False grip: muñeca apoyada en las anillas para acortar el pull",
        "Anillas a la altura de la cadera, cuerpo recto colgado",
      ],
      dos: [
        "Pull agresivo y alto: pecho hacia las anillas",
        "Transición rápida: inclinar el torso adelante al llegar al pecho",
        "Empujar a lockout con turnout al final",
      ],
      donts: [
        "Perder el false grip — convierte el movimiento en imposible",
        "Pull demasiado vertical (como pull-up) en vez de inclinado",
        "Quedarse debajo de las anillas en la transición",
      ],
    },
    commonMistakes: [
      {
        title: "No pasar la transición (queda atascado en el pecho)",
        description:
          "El momento más difícil del MU. Se necesita inclinar el torso hacia adelante para pasar las anillas.",
        fixCue:
          "Inclina el torso sobre las anillas al llegar al nivel del pecho",
      },
      {
        title: "Pull sin false grip",
        description:
          "Sin false grip, el pull necesita ser mucho más alto y el movimiento se vuelve casi imposible.",
        fixCue:
          "False grip estricto: el hueso del radio apoyado sobre la anilla",
      },
    ],
    progressions: [
      {
        name: "False grip ring row",
        level: "beginner",
        description:
          "Ring row con false grip mantenido. Construye fuerza del pull y acostumbra la muñeca a la posición.",
      },
      {
        name: "Transition drill con banda (banded MU)",
        level: "beginner",
        description:
          "Banda elástica bajo los pies o caderas reduce el peso. Permite practicar la transición completa.",
      },
      {
        name: "Jumping muscle-up en anillas bajas",
        level: "intermediate",
        description:
          "Con anillas a nivel del pecho, usar un pequeño salto para generar momentum. Énfasis en la transición.",
      },
      {
        name: "Strict ring muscle-up",
        level: "advanced",
        description:
          "Muscle-up completo sin momentum de kip. Máxima expresión de fuerza: pull + transición + dip.",
      },
    ],
    musclesWorked: [
      "Dorsales",
      "Bíceps",
      "Tríceps",
      "Pecho",
      "Core",
      "Antebrazos",
    ],
    difficulty: 5,
  },
  "muscle-up-bar": {
    cues: {
      setup: [
        "Agarre prono, manos ligeramente más amplias que hombros",
        "Cuerpo en arco (arch) como posición de salida del kip",
      ],
      dos: [
        "Kip agresivo: hips-to-bar en el pull — las caderas van a la barra",
        "Lean adelante del torso al llegar arriba para facilitar la transición",
        "Press-out limpio: empujar a lockout completo",
      ],
      donts: [
        "Pull vertical como pull-up estándar (no alcanza la barra)",
        "Codos muy abiertos durante la transición",
        "Bloquear el kip antes de que la cadera llegue a la barra",
      ],
    },
    commonMistakes: [
      {
        title: "Hips no llegan a la barra",
        description:
          "El pull no es suficientemente alto. En bar MU, las caderas deben ir a nivel de la barra para hacer la transición.",
        fixCue: "Piensa 'caderas a la barra', no 'mentón a la barra'",
      },
      {
        title: "Transición con torso vertical",
        description:
          "Quedarse derecho no permite pasar los codos sobre la barra.",
        fixCue: "Inclina el torso sobre la barra en el momento del pull alto",
      },
    ],
    progressions: [
      {
        name: "Kipping pull-up alto (hip-to-bar)",
        level: "beginner",
        description:
          "Pull-up con kip llevando la cadera a tocar la barra. Construye la mecánica del pull alto sin hacer la transición.",
      },
      {
        name: "Chest-to-bar con kip agresivo",
        level: "intermediate",
        description:
          "El pecho toca la barra con kip potente. Un paso antes del MU.",
      },
      {
        name: "Bar muscle-up con banda",
        level: "intermediate",
        description:
          "Banda elástica en los pies reduce el peso. Permite practicar el pull alto y la transición.",
      },
      {
        name: "Bar muscle-up estándar",
        level: "advanced",
        description:
          "Muscle-up completo en barra fija: kip, hips-to-bar, transición, press-out limpio.",
      },
    ],
    musclesWorked: ["Dorsales", "Bíceps", "Tríceps", "Hombros", "Core"],
    difficulty: 5,
  },
  "clean-and-jerk": {
    cues: {
      setup: [
        "Mismo setup que el clean: barra sobre el medio del pie, espalda neutra",
        "Antes del jerk: recuperar completamente del clean, respirar",
      ],
      dos: [
        "Clean completo primero: rack frontal sólido con codos altos",
        "Jerk: dip corto y vertical, drive explosivo, recibir en split o push jerk",
        "Bloquear overhead antes de recuperar el split",
      ],
      donts: [
        "Hacer el jerk sin recuperarse completamente del clean",
        "Dip horizontal en el jerk (carga la espalda baja)",
        "Flexionar brazos antes de que las piernas completen el drive",
      ],
    },
    commonMistakes: [
      {
        title: "Jerk inmediato sin recuperar del clean",
        description:
          "El atleta no completa la posición de rack frontal antes de hacer el jerk, perdiendo eficiencia.",
        fixCue: "Pausa de 1-2 seg en el rack, estabiliza y luego jerk",
      },
      {
        title: "Barra hacia adelante en el jerk",
        description:
          "El drive no es vertical, la barra sale al frente del overhead.",
        fixCue: "Empuja la cabeza por la 'ventana' al finalizar el drive",
      },
    ],
    progressions: [
      {
        name: "Clean + pause front squat",
        level: "beginner",
        description:
          "Practicar el clean llegando a rack frontal sólido sin jerk. Foco en la postura de recepción.",
      },
      {
        name: "Clean + push press",
        level: "beginner",
        description:
          "Clean seguido de push press (no jerk). Introduce el overhead sin la complejidad del split.",
      },
      {
        name: "Clean + push jerk",
        level: "intermediate",
        description:
          "Clean completo seguido de push jerk con recepción en press position. El patrón base del C&J competitivo.",
      },
      {
        name: "Clean and jerk con split jerk",
        level: "advanced",
        description:
          "Clean completo + split jerk. Permite manejar pesos máximos con mayor estabilidad overhead.",
      },
    ],
    musclesWorked: [
      "Isquiotibiales",
      "Glúteos",
      "Cuádriceps",
      "Trapecios",
      "Hombros",
      "Tríceps",
      "Core",
    ],
    difficulty: 5,
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
    musclesWorked: ["Hombros", "Tríceps", "Core", "Trapecios"],
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
    musclesWorked: ["Glúteos", "Isquiotibiales", "Core", "Hombros", "Dorsales"],
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
    musclesWorked: ["Cuerpo completo", "Core", "Hombros", "Cuádriceps"],
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
    musclesWorked: ["Cuádriceps", "Glúteos", "Hombros", "Core"],
    difficulty: 2,
  },
};
