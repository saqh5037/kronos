import { PrismaClient, type MovementCategory } from "@prisma/client";

const prisma = new PrismaClient();

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
    videoUrl: null,
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
    videoUrl: null,
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
    videoUrl: null,
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
    videoUrl: null,
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
    videoUrl: null,
    equipment: [],
  },
  {
    slug: "jumping-pull-up",
    name: "Jumping Pull-up",
    category: "GYMNASTICS",
    standardDescription:
      "Pull-up con impulso de piernas desde el suelo. Score: reps. Tips RX: chin clearly over bar, control en el descenso.",
    videoUrl: null,
    equipment: ["Pull-up bar"],
  },
  {
    slug: "knee-raise",
    name: "Knee Raise",
    category: "GYMNASTICS",
    standardDescription:
      "Desde colgado en barra, llevar las rodillas al pecho. Score: reps. Escalada de toes-to-bar.",
    videoUrl: null,
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
    videoUrl: null,
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
    videoUrl: null,
    equipment: ["Assault Bike"],
  },
  {
    slug: "ski-erg",
    name: "Ski Erg",
    category: "MONOSTRUCTURAL",
    standardDescription:
      "Ski ergómetro. Score: calories o time. Tips RX: empujar con el cuerpo hacia abajo, no solo los brazos.",
    videoUrl: null,
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
    videoUrl: null,
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
    videoUrl: null,
    equipment: [],
  },
  {
    slug: "sit-up",
    name: "Sit-up",
    category: "ACCESSORY",
    standardDescription:
      "Abdominal. Score: reps. Tips RX: mariposa position (soles de los pies juntos), manos tocan el suelo tras la cabeza.",
    videoUrl: null,
    equipment: [],
  },
  {
    slug: "ghd-sit-up",
    name: "GHD Sit-up",
    category: "ACCESSORY",
    standardDescription:
      "Abdominal en máquina GHD (Glute Ham Developer). Score: reps. Tips RX: hiperextensión controlada, manos a los tobillos.",
    videoUrl: null,
    equipment: ["GHD"],
  },
  {
    slug: "sled-push",
    name: "Sled Push",
    category: "ACCESSORY",
    standardDescription:
      "Empuje de trineo cargado. Score: distance (m) o time. Tips RX: inclinación 45°, pasos cortos y explosivos.",
    videoUrl: null,
    equipment: ["Sled"],
  },
  {
    slug: "sled-pull",
    name: "Sled Pull",
    category: "ACCESSORY",
    standardDescription:
      "Jalón de trineo cargado. Score: distance (m). Tips RX: lean atrás, pasos potentes.",
    videoUrl: null,
    equipment: ["Sled", "Harness"],
  },
  {
    slug: "devils-press",
    name: "Devil's Press",
    category: "ACCESSORY",
    standardDescription:
      "Burpee + dumbbell snatch (ambos brazos simultáneamente). Score: reps. Tips RX: snatch explosivo desde el burpee.",
    videoUrl: null,
    equipment: ["Dumbbell"],
  },
  {
    slug: "man-maker",
    name: "Man Maker",
    category: "ACCESSORY",
    standardDescription:
      "Push-up + row + row + thruster con mancuernas. Score: reps. Tips RX: movimiento fluido, core activo durante el push-up.",
    videoUrl: null,
    equipment: ["Dumbbell"],
  },
];

/**
 * Creates/upserts the 50 standard CrossFit movements for a given tenantId.
 * Uses isStandard=true flag. Idempotent — safe to run multiple times.
 */
export async function seedStandardMovements(tenantId: string): Promise<void> {
  console.log(
    `  Seeding ${STANDARD_MOVEMENTS.length} standard movements for tenant ${tenantId}...`,
  );
  for (const mv of STANDARD_MOVEMENTS) {
    await prisma.movement.upsert({
      where: { tenantId_slug: { tenantId, slug: mv.slug } },
      update: {
        name: mv.name,
        category: mv.category,
        standardDescription: mv.standardDescription,
        videoUrl: mv.videoUrl,
        equipment: mv.equipment,
        isStandard: true,
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
      },
    });
  }
  console.log(`  ✅ ${STANDARD_MOVEMENTS.length} movimientos seeded`);
}
