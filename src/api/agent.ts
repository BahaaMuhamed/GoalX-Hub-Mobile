import { apiRequest } from '@/api/client';

export type FoodGoal = 'muscle' | 'fat' | 'maintain' | 'performance';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type FoodPreference = 'balanced' | 'protein' | 'vegetarian' | 'lowcarb';
export type FoodRestriction = 'none' | 'dairy' | 'gluten' | 'nuts' | 'seafood';
export type TrainingGoal = 'fitness' | 'power' | 'skill' | 'recover';
export type TrainingDays = '2' | '3' | '4' | '5' | '6';
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';
export type TrainingLimit = 'none' | 'knee' | 'ankle' | 'hamstring' | 'back';
export type FitnessGoal = 'strength' | 'hypertrophy' | 'fat' | 'general' | 'performance' | 'speed' | 'power' | 'endurance' | 'mobility';
export type FitnessExperience = 'beginner' | 'intermediate' | 'advanced';
export type FitnessEquipment = 'bodyweight' | 'home' | 'gym';
export type FitnessLimitation = 'none' | 'knee' | 'ankle' | 'hamstring' | 'back' | 'shoulder';

export type AgentSection = { title: string; items: string[] };

export type FoodPlan = {
  source: string;
  summary: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
  meals: { icon: string; title: string; time: string; foods: string; kcal: number; protein: number; carbs: number; fats: number }[];
  tips: string[];
  sections: AgentSection[];
  disclaimer: string;
};

export type TrainingPlan = {
  source: string;
  summary: string;
  sessions: number;
  minutes: number;
  intensity: string;
  focus: string;
  blocks: { icon: string; title: string; detail: string; minutes: number }[];
  tips: string[];
  sections: AgentSection[];
  disclaimer: string;
};

export type FitnessExercise = {
  name: string;
  primary: string;
  secondary: string;
  pattern: string;
  sets: number;
  reps: string;
  restSeconds: number;
  equipment: string;
  difficulty: string;
  instructions: string[];
  mistakes: string[];
  easier: string;
  progression: string;
};

export type FitnessPlan = {
  source: string;
  summary: string;
  goalLabel: string;
  experienceLabel: string;
  days: number;
  minutes: number;
  assumptions: string[];
  muscles: { group: string; targets: string; reason: string }[];
  sessions: {
    day: number;
    name: string;
    focus: string;
    warmUp: string;
    coolDown: string;
    minutes: number;
    exercises: FitnessExercise[];
  }[];
  reviewWeeks: number;
  progression: string[];
  tracking: string[];
  safety: string[];
  limitations: string[];
};

export type PlayerBasics = {
  name: string;
  age: number | null;
  position: string;
  gender: string;
};

const base = '/players/me/agent';

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function num(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

function lines(value: unknown): string[] {
  return (Array.isArray(value) ? value : []).map(text).filter(Boolean);
}

function join(value: unknown): string {
  return lines(value).join(', ');
}

function sections(value: unknown): AgentSection[] {
  return (Array.isArray(value) ? value : []).map((item) => {
    const row = record(item);
    return { title: text(row?.title), items: lines(row?.items) };
  }).filter((item) => item.title || item.items.length);
}

function mapFood(body: Record<string, unknown>): FoodPlan {
  const meals = Array.isArray(body.meals) ? body.meals : [];
  return {
    source: text(body.source),
    summary: text(body.summary),
    calories: num(body.calories),
    proteinG: num(body.proteinG),
    carbsG: num(body.carbsG),
    fatsG: num(body.fatsG),
    proteinPct: num(body.proteinPct),
    carbsPct: num(body.carbsPct),
    fatsPct: num(body.fatsPct),
    meals: meals.map((item) => {
      const row = record(item);
      return {
        icon: text(row?.icon) || '🍴',
        title: text(row?.title),
        time: text(row?.time),
        foods: text(row?.foods),
        kcal: num(row?.kcal),
        protein: num(row?.protein),
        carbs: num(row?.carbs),
        fats: num(row?.fats),
      };
    }),
    tips: lines(body.tips),
    sections: sections(body.sections),
    disclaimer: text(body.disclaimer),
  };
}

function mapTraining(body: Record<string, unknown>): TrainingPlan {
  const blocks = Array.isArray(body.blocks) ? body.blocks : [];
  return {
    source: text(body.source),
    summary: text(body.summary),
    sessions: num(body.sessions),
    minutes: num(body.minutes),
    intensity: text(body.intensity),
    focus: text(body.focus),
    blocks: blocks.map((item) => {
      const row = record(item);
      return {
        icon: text(row?.icon) || '⚽',
        title: text(row?.title),
        detail: text(row?.detail),
        minutes: num(row?.minutes),
      };
    }),
    tips: lines(body.tips),
    sections: sections(body.sections),
    disclaimer: text(body.disclaimer),
  };
}

function timed(value: unknown): string {
  return (Array.isArray(value) ? value : []).map((item) => {
    const row = record(item);
    const name = text(row?.exercise);
    const minutes = num(row?.durationMinutes);
    return name ? `${name} (${minutes})` : '';
  }).filter(Boolean).join(' · ');
}

function mapFitness(body: Record<string, unknown>): FitnessPlan {
  const summary = record(body.playerSummary);
  const progress = record(body.progressionPlan);
  const sessions = Array.isArray(body.weeklyPlan) ? body.weeklyPlan : [];
  const muscles = Array.isArray(body.muscleAnalysis) ? body.muscleAnalysis : [];
  return {
    source: text(body.source),
    summary: text(body.summary),
    goalLabel: text(summary?.goal),
    experienceLabel: text(summary?.experienceLevel),
    days: num(summary?.trainingDaysPerWeek) || num(body.days),
    minutes: num(summary?.sessionDurationMinutes) || num(body.durationMinutes),
    assumptions: lines(summary?.assumptions),
    muscles: muscles.map((item) => {
      const row = record(item);
      return { group: text(row?.muscleGroup), targets: join(row?.targetMuscles), reason: text(row?.reason) };
    }).filter((item) => item.group),
    sessions: sessions.map((item) => {
      const row = record(item);
      const exercises = Array.isArray(row?.exercises) ? row.exercises : [];
      return {
        day: num(row?.day),
        name: text(row?.sessionName),
        focus: join(row?.focus),
        warmUp: timed(row?.warmUp),
        coolDown: timed(row?.coolDown),
        minutes: num(row?.estimatedDurationMinutes),
        exercises: exercises.map((exercise) => {
          const line = record(exercise);
          return {
            name: text(line?.name),
            primary: join(line?.primaryMuscles),
            secondary: join(line?.secondaryMuscles),
            pattern: text(line?.movementPattern),
            sets: num(line?.sets),
            reps: text(line?.reps),
            restSeconds: num(line?.restSeconds),
            equipment: join(line?.equipment),
            difficulty: text(line?.difficulty),
            instructions: lines(line?.instructions),
            mistakes: lines(line?.commonMistakes),
            easier: text(line?.easierAlternative),
            progression: text(line?.progression),
          };
        }).filter((exercise) => exercise.name),
      };
    }),
    reviewWeeks: num(progress?.reviewPeriodWeeks) || 2,
    progression: lines(progress?.progressionCriteria),
    tracking: lines(progress?.trackingMetrics),
    safety: lines(body.safetyNotes),
    limitations: lines(body.limitations),
  };
}

async function readPlan<T>(path: string, map: (body: Record<string, unknown>) => T): Promise<T | null> {
  try {
    const body = await apiRequest<Record<string, unknown>>(path, { auth: true });
    if (!body || text(body.source) !== 'OLLAMA') return null;
    return map(body);
  } catch {
    return null;
  }
}

export function loadLatestFood(): Promise<FoodPlan | null> {
  return readPlan(`${base}/food/latest`, mapFood);
}

export function loadLatestTraining(): Promise<TrainingPlan | null> {
  return readPlan(`${base}/training/latest`, mapTraining);
}

export function loadLatestFitness(): Promise<FitnessPlan | null> {
  return readPlan(`${base}/fitness/latest`, mapFitness);
}

export async function createFoodPlan(body: {
  weightKg: number;
  heightCm: number;
  age: number | null;
  language: string;
  goal: FoodGoal;
  activity: ActivityLevel;
  preference: FoodPreference;
  restriction: FoodRestriction;
}): Promise<FoodPlan> {
  const response = await apiRequest<Record<string, unknown>>(`${base}/food`, { method: 'POST', auth: true, body });
  return mapFood(response);
}

export async function createTrainingPlan(body: {
  age: number | null;
  language: string;
  goal: TrainingGoal;
  days: TrainingDays;
  level: TrainingLevel;
  limit: TrainingLimit;
}): Promise<TrainingPlan> {
  const response = await apiRequest<Record<string, unknown>>(`${base}/training`, { method: 'POST', auth: true, body });
  return mapTraining(response);
}

export async function createFitnessPlan(body: {
  weightKg: number;
  heightCm: number;
  age: number | null;
  gender: string;
  position: string;
  language: string;
  goal: FitnessGoal;
  experience: FitnessExperience;
  equipment: FitnessEquipment;
  days: number;
  durationMinutes: number;
  limitation: FitnessLimitation;
}): Promise<FitnessPlan> {
  const response = await apiRequest<Record<string, unknown>>(`${base}/fitness`, { method: 'POST', auth: true, body });
  return mapFitness(response);
}

export async function loadPlayerBasics(): Promise<PlayerBasics> {
  const empty: PlayerBasics = { name: '', age: null, position: '', gender: '' };
  try {
    const [account, player] = await Promise.all([
      apiRequest<Record<string, unknown>>('/users/me', { auth: true }).catch(() => null),
      apiRequest<Record<string, unknown>>('/players/me', { auth: true }).catch(() => null),
    ]);
    const user = record(player?.user);
    const name = text(player?.fullName) || text(user?.fullName) || text(account?.fullName) || text(account?.username);
    const born = text(player?.dateOfBirth) || text(user?.dateOfBirth) || text(account?.dateOfBirth);
    return {
      name,
      age: ageFrom(born),
      position: text(player?.position) || text(user?.position),
      gender: text(player?.gender) || text(user?.gender) || text(account?.gender),
    };
  } catch {
    return empty;
  }
}

function ageFrom(value: string): number | null {
  if (!value) return null;
  const born = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday = now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 8 && age <= 80 ? age : null;
}
