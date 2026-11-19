import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createFitnessPlan,
  createFoodPlan,
  createTrainingPlan,
  loadLatestFitness,
  loadLatestFood,
  loadLatestTraining,
  loadPlayerBasics,
  type ActivityLevel,
  type FitnessEquipment,
  type FitnessExperience,
  type FitnessGoal,
  type FitnessLimitation,
  type FitnessPlan,
  type FoodGoal,
  type FoodPlan,
  type FoodPreference,
  type FoodRestriction,
  type TrainingDays,
  type TrainingGoal,
  type TrainingLevel,
  type TrainingLimit,
  type TrainingPlan,
} from '@/api/agent';
import { ApiError, errorMessage } from '@/api/errors';
import { AppTabBar } from '@/components/AppTabBar';
import { DropDown } from '@/components/DropDown';
import { ink } from '@/components/DirectoryChrome';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';

type Tab = 'food' | 'training' | 'fitness';

export function GlobalAgentScreen() {
  const { lang } = useLocale();
  const ar = lang === 'ar';
  const wide = useWindowDimensions().width >= 900;
  const copy = labels(ar);
  const [tab, setTab] = useState<Tab>('food');
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<FoodGoal>('muscle');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [preference, setPreference] = useState<FoodPreference>('balanced');
  const [restriction, setRestriction] = useState<FoodRestriction>('none');
  const [foodError, setFoodError] = useState({ weight: '', height: '' });
  const [foodNotice, setFoodNotice] = useState('');
  const [foodBusy, setFoodBusy] = useState(false);
  const [foodLocked, setFoodLocked] = useState(false);
  const [foodPlan, setFoodPlan] = useState<FoodPlan | null>(null);
  const [foodFull, setFoodFull] = useState(false);

  const [trainGoal, setTrainGoal] = useState<TrainingGoal>('fitness');
  const [trainDays, setTrainDays] = useState<TrainingDays>('4');
  const [trainLevel, setTrainLevel] = useState<TrainingLevel>('intermediate');
  const [trainLimit, setTrainLimit] = useState<TrainingLimit>('none');
  const [trainingNotice, setTrainingNotice] = useState('');
  const [trainingBusy, setTrainingBusy] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [trainingFull, setTrainingFull] = useState(false);

  const [fitWeight, setFitWeight] = useState('');
  const [fitHeight, setFitHeight] = useState('');
  const [fitAge, setFitAge] = useState('');
  const [fitGender, setFitGender] = useState('');
  const [position, setPosition] = useState('');
  const [fitGoal, setFitGoal] = useState<FitnessGoal>('performance');
  const [fitExperience, setFitExperience] = useState<FitnessExperience>('beginner');
  const [fitEquipment, setFitEquipment] = useState<FitnessEquipment>('bodyweight');
  const [fitDays, setFitDays] = useState('3');
  const [fitMinutes, setFitMinutes] = useState('45');
  const [fitLimit, setFitLimit] = useState<FitnessLimitation>('none');
  const [fitnessError, setFitnessError] = useState({ weight: '', height: '', age: '' });
  const [fitnessNotice, setFitnessNotice] = useState('');
  const [fitnessBusy, setFitnessBusy] = useState(false);
  const [fitnessLocked, setFitnessLocked] = useState(false);
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [fitnessFull, setFitnessFull] = useState(false);
  const [openDay, setOpenDay] = useState(1);

  const load = useCallback(async () => {
    const basics = await loadPlayerBasics();
    if (basics.name) setName(basics.name);
    setAge(basics.age);
    if (basics.position) setPosition(basics.position);
    if (basics.gender === 'male' || basics.gender === 'female') setFitGender(basics.gender);
    const [food, training, fitness] = await Promise.all([loadLatestFood(), loadLatestTraining(), loadLatestFitness()]);
    if (food) setFoodPlan(food);
    if (training) setTrainingPlan(training);
    if (fitness) setFitnessPlan(fitness);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const first = name.trim().split(/\s+/)[0] || name;

  async function generateFood() {
    const weightKg = amount(weight);
    const heightCm = amount(height);
    const next = {
      weight: weightKg == null || weightKg < 30 || weightKg > 200 ? copy.errWeight : '',
      height: heightCm == null || heightCm < 120 || heightCm > 230 ? copy.errHeight : '',
    };
    setFoodError(next);
    if (next.weight || next.height || weightKg == null || heightCm == null) return;
    setFoodBusy(true);
    setFoodNotice('');
    setFoodLocked(true);
    try {
      const plan = await createFoodPlan({
        weightKg, heightCm, age, language: lang, goal, activity, preference, restriction,
      });
      setFoodPlan(plan);
      setFoodNotice(plan.source === 'OLLAMA' ? '' : copy.fallback);
    } catch (error) {
      setFoodNotice(error instanceof ApiError && error.status === 429 ? copy.rate : errorMessage(error, copy.fallback));
    } finally {
      setFoodBusy(false);
    }
  }

  async function generateTraining() {
    setTrainingBusy(true);
    setTrainingNotice('');
    try {
      const plan = await createTrainingPlan({
        age, language: lang, goal: trainGoal, days: trainDays, level: trainLevel, limit: trainLimit,
      });
      setTrainingPlan(plan);
      setTrainingNotice(plan.source === 'OLLAMA' ? '' : copy.fallback);
    } catch (error) {
      setTrainingNotice(error instanceof ApiError && error.status === 429 ? copy.rate : errorMessage(error, copy.fallback));
    } finally {
      setTrainingBusy(false);
    }
  }

  function openFitness() {
    setTab('fitness');
    if (!fitWeight) setFitWeight(weight);
    if (!fitHeight) setFitHeight(height);
  }

  async function generateFitness() {
    const weightKg = amount(fitWeight);
    const heightCm = amount(fitHeight);
    const years = age ?? amount(fitAge);
    const next = {
      weight: weightKg == null || weightKg < 30 || weightKg > 200 ? copy.errWeight : '',
      height: heightCm == null || heightCm < 120 || heightCm > 230 ? copy.errHeight : '',
      age: years == null || years < 8 || years > 80 ? copy.errAge : '',
    };
    setFitnessError(next);
    if (next.weight || next.height || next.age || weightKg == null || heightCm == null) return;
    setFitnessBusy(true);
    setFitnessNotice('');
    setFitnessLocked(true);
    try {
      const plan = await createFitnessPlan({
        weightKg,
        heightCm,
        age: years,
        gender: fitGender,
        position: position.trim(),
        language: lang,
        goal: fitGoal,
        experience: fitExperience,
        equipment: fitEquipment,
        days: Number(fitDays),
        durationMinutes: Number(fitMinutes),
        limitation: fitLimit,
      });
      setFitnessPlan(plan);
      setOpenDay(plan.sessions[0]?.day || 1);
      setFitnessNotice(plan.source === 'OLLAMA' ? '' : copy.fallback);
    } catch (error) {
      setFitnessNotice(error instanceof ApiError && error.status === 429 ? copy.rate : errorMessage(error, copy.fallback));
    } finally {
      setFitnessBusy(false);
    }
  }

  const icon = tab === 'food' ? '🍏' : tab === 'training' ? '⚽' : '💪';
  const lead = tab === 'food' ? copy.foodLead : tab === 'training' ? copy.trainingLead : copy.fitnessLead;
  const resultLead = tab === 'food' ? copy.foodResult : tab === 'training' ? copy.trainingResult : copy.fitnessResult;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenBack />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          <TabButton label={copy.foodTab} active={tab === 'food'} onPress={() => setTab('food')} />
          <TabButton label={copy.trainingTab} active={tab === 'training'} onPress={() => setTab('training')} />
          <TabButton label={copy.fitnessTab} active={tab === 'fitness'} onPress={openFitness} />
        </ScrollView>
        <View style={[styles.grid, wide && styles.gridWide]}>
          <View style={styles.card}>
            <Head icon={icon} title={copy.title} lead={lead} />
            {tab === 'food' ? (
              <>
                <Section title={copy.info} hint={copy.infoHint} />
                <Field label={copy.name} value={name} editable={false} icon="👤" />
                <Field label={copy.weight} value={weight} onChange={setWeight} unit={copy.kg} icon="⚖️" locked={foodLocked} error={foodError.weight} />
                <Field label={copy.height} value={height} onChange={setHeight} unit={copy.cm} icon="📏" locked={foodLocked} error={foodError.height} />
                <Section title={copy.goals} hint={copy.goalsHint} />
                <DropDown label={`1. ${copy.qObjective}`} value={goal} placeholder={copy.qObjective} options={copy.foodGoals} onChange={(id) => setGoal(id as FoodGoal)} />
                <DropDown label={`2. ${copy.qActivity}`} value={activity} placeholder={copy.qActivity} options={copy.activities} onChange={(id) => setActivity(id as ActivityLevel)} />
                <DropDown label={`3. ${copy.qPreference}`} value={preference} placeholder={copy.qPreference} options={copy.preferences} onChange={(id) => setPreference(id as FoodPreference)} />
                <DropDown label={`4. ${copy.qRestriction}`} value={restriction} placeholder={copy.qRestriction} options={copy.restrictions} onChange={(id) => setRestriction(id as FoodRestriction)} />
                <Submit label={foodBusy ? copy.generating : copy.generateFood} busy={foodBusy} onPress={() => void generateFood()} />
                {foodNotice ? <Text style={styles.note}>{foodNotice}</Text> : null}
              </>
            ) : null}
            {tab === 'training' ? (
              <>
                <Section title={copy.info} hint={copy.trainingInfoHint} />
                <Field label={copy.name} value={name} editable={false} icon="👤" />
                <Section title={copy.trainingGoals} hint={copy.goalsHint} />
                <DropDown label={`1. ${copy.tqGoal}`} value={trainGoal} placeholder={copy.tqGoal} options={copy.trainGoals} onChange={(id) => setTrainGoal(id as TrainingGoal)} />
                <DropDown label={`2. ${copy.tqDays}`} value={trainDays} placeholder={copy.tqDays} options={copy.days} onChange={(id) => setTrainDays(id as TrainingDays)} />
                <DropDown label={`3. ${copy.tqLevel}`} value={trainLevel} placeholder={copy.tqLevel} options={copy.levels} onChange={(id) => setTrainLevel(id as TrainingLevel)} />
                <DropDown label={`4. ${copy.tqLimit}`} value={trainLimit} placeholder={copy.tqLimit} options={copy.limits} onChange={(id) => setTrainLimit(id as TrainingLimit)} />
                <Submit label={trainingBusy ? copy.generating : copy.generateTraining} busy={trainingBusy} onPress={() => void generateTraining()} />
                {trainingNotice ? <Text style={styles.note}>{trainingNotice}</Text> : null}
              </>
            ) : null}
            {tab === 'fitness' ? (
              <>
                <Section title={copy.info} hint={copy.fitnessInfoHint} />
                <Field label={copy.name} value={name} editable={false} icon="👤" />
                <Field label={copy.weight} value={fitWeight} onChange={setFitWeight} unit={copy.kg} icon="⚖️" locked={fitnessLocked} error={fitnessError.weight} />
                <Field label={copy.height} value={fitHeight} onChange={setFitHeight} unit={copy.cm} icon="📏" locked={fitnessLocked} error={fitnessError.height} />
                {age == null ? <Field label={copy.age} value={fitAge} onChange={setFitAge} icon="🎂" error={fitnessError.age} /> : null}
                <Section title={copy.fitnessGoals} hint={copy.goalsHint} />
                <DropDown label={`1. ${copy.fqGoal}`} value={fitGoal} placeholder={copy.fqGoal} options={copy.fitGoals} onChange={(id) => setFitGoal(id as FitnessGoal)} />
                <DropDown label={`2. ${copy.fqLevel}`} value={fitExperience} placeholder={copy.fqLevel} options={copy.levels} onChange={(id) => setFitExperience(id as FitnessExperience)} />
                <DropDown label={`3. ${copy.fqEquipment}`} value={fitEquipment} placeholder={copy.fqEquipment} options={copy.equipment} onChange={(id) => setFitEquipment(id as FitnessEquipment)} />
                <DropDown label={`4. ${copy.fqSchedule}`} value={fitDays} placeholder={copy.fqSchedule} options={copy.days} onChange={setFitDays} />
                <DropDown label={copy.minutes} value={fitMinutes} placeholder={copy.minutes} options={copy.durations} onChange={setFitMinutes} />
                <DropDown label={`5. ${copy.fqLimit}`} value={fitLimit} placeholder={copy.fqLimit} options={copy.fitLimits} onChange={(id) => setFitLimit(id as FitnessLimitation)} />
                <DropDown label={`6. ${copy.fqExtra}`} value={fitGender} placeholder={copy.genderSkip} options={copy.genders} onChange={setFitGender} />
                <Field label={copy.position} value={position} onChange={setPosition} icon="⚽" required={false} />
                <Submit label={fitnessBusy ? copy.generating : copy.generateFitness} busy={fitnessBusy} onPress={() => void generateFitness()} />
                {fitnessNotice ? <Text style={styles.note}>{fitnessNotice}</Text> : null}
              </>
            ) : null}
          </View>

          <View style={styles.card}>
            <Head icon="🤖" title={copy.title} lead={resultLead} soft />
            {tab === 'food' && foodPlan ? <FoodResult plan={foodPlan} name={first} full={foodFull} onToggle={() => setFoodFull((open) => !open)} copy={copy} /> : null}
            {tab === 'food' && !foodPlan ? <Empty icon="🍏" text={copy.emptyFood} /> : null}
            {tab === 'training' && trainingPlan ? <TrainingResult plan={trainingPlan} name={first} full={trainingFull} onToggle={() => setTrainingFull((open) => !open)} copy={copy} /> : null}
            {tab === 'training' && !trainingPlan ? <Empty icon="⚽" text={copy.emptyTraining} /> : null}
            {tab === 'fitness' && fitnessPlan ? (
              <FitnessResult
                plan={fitnessPlan}
                name={first}
                full={fitnessFull}
                openDay={openDay}
                onToggle={() => setFitnessFull((open) => !open)}
                onDay={setOpenDay}
                copy={copy}
              />
            ) : null}
            {tab === 'fitness' && !fitnessPlan ? <Empty icon="💪" text={copy.emptyFitness} /> : null}
          </View>
        </View>
      </ScrollView>
      <AppTabBar active={null} />
    </SafeAreaView>
  );
}

function FoodResult({ plan, name, full, onToggle, copy }: { plan: FoodPlan; name: string; full: boolean; onToggle: () => void; copy: Copy }) {
  return (
    <View style={styles.result}>
      <Hello name={name} summary={plan.summary} hi={copy.hi} />
      <View style={styles.macros}>
        <Macro icon="🔥" label={copy.kcal} value={`${plan.calories} ${copy.kcalUnit}`} note={copy.kcalNote} />
        <Macro icon="💪" label={copy.protein} value={`${plan.proteinG} ${copy.g}`} note={`≈ ${plan.proteinPct}%`} />
        <Macro icon="🌾" label={copy.carbs} value={`${plan.carbsG} ${copy.g}`} note={`≈ ${plan.carbsPct}%`} />
        <Macro icon="💧" label={copy.fats} value={`${plan.fatsG} ${copy.g}`} note={`≈ ${plan.fatsPct}%`} />
      </View>
      <BlockHead title={`🍴 ${copy.meals}`} action={full ? copy.hideFull : copy.viewFull} onPress={onToggle} />
      {plan.meals.map((meal, index) => (
        <View key={`${meal.title}-${index}`} style={styles.line}>
          <Text style={styles.lineIcon}>{meal.icon}</Text>
          <View style={styles.grow}>
            <Text style={styles.lineTitle}>{meal.title}{meal.time ? ` (${meal.time})` : ''}</Text>
            <Text style={styles.lineBody}>{meal.foods}</Text>
          </View>
          <Text style={styles.lineMeta}>≈ {meal.kcal} {copy.kcalUnit}</Text>
        </View>
      ))}
      {full ? plan.sections.map((section) => <Extra key={section.title} title={section.title} items={section.items} />) : null}
      <Extra title={`📍 ${copy.tips}`} items={plan.tips} />
      {plan.disclaimer ? <Text style={styles.disclaimer}>{plan.disclaimer}</Text> : null}
    </View>
  );
}

function TrainingResult({ plan, name, full, onToggle, copy }: { plan: TrainingPlan; name: string; full: boolean; onToggle: () => void; copy: Copy }) {
  return (
    <View style={styles.result}>
      <Hello name={name} summary={plan.summary} hi={copy.hi} />
      <View style={styles.macros}>
        <Macro icon="📅" label={copy.sessions} value={String(plan.sessions)} note={copy.perWeek} />
        <Macro icon="⏱️" label={copy.duration} value={String(plan.minutes)} note={copy.min} />
        <Macro icon="⚡" label={copy.intensity} value={plan.intensity} />
        <Macro icon="🎯" label={copy.focus} value={plan.focus} />
      </View>
      <BlockHead title={`⚽ ${copy.blocks}`} action={full ? copy.hideFullTraining : copy.viewFullTraining} onPress={onToggle} />
      {plan.blocks.map((block, index) => (
        <View key={`${block.title}-${index}`} style={styles.line}>
          <Text style={styles.lineIcon}>{block.icon}</Text>
          <View style={styles.grow}>
            <Text style={styles.lineTitle}>{block.title}</Text>
            <Text style={styles.lineBody}>{block.detail}</Text>
          </View>
          <Text style={styles.lineMeta}>{block.minutes} {copy.min}</Text>
        </View>
      ))}
      {full ? plan.sections.map((section) => <Extra key={section.title} title={section.title} items={section.items} />) : null}
      <Extra title={`📍 ${copy.tips}`} items={plan.tips} />
      {plan.disclaimer ? <Text style={styles.disclaimer}>{plan.disclaimer}</Text> : null}
    </View>
  );
}

function FitnessResult({
  plan, name, full, openDay, onToggle, onDay, copy,
}: {
  plan: FitnessPlan;
  name: string;
  full: boolean;
  openDay: number;
  onToggle: () => void;
  onDay: (day: number) => void;
  copy: Copy;
}) {
  return (
    <View style={styles.result}>
      <Hello name={name} summary={plan.summary} hi={copy.hi} />
      <View style={styles.macros}>
        <Macro icon="🎯" label={copy.statGoal} value={plan.goalLabel} />
        <Macro icon="📈" label={copy.statLevel} value={plan.experienceLabel} />
        <Macro icon="📅" label={copy.sessions} value={String(plan.days)} note={copy.perWeek} />
        <Macro icon="⏱️" label={copy.duration} value={String(plan.minutes)} note={copy.min} />
      </View>
      <Extra title={copy.muscles} items={plan.muscles.map((item) => `${item.group}: ${item.targets}. ${item.reason}`)} />
      <BlockHead title={`💪 ${copy.week}`} action={full ? copy.hideFull : copy.viewFull} onPress={onToggle} />
      {plan.sessions.map((session) => {
        const open = openDay === session.day;
        return (
          <View key={session.day} style={styles.day}>
            <Pressable style={styles.dayHead} onPress={() => onDay(open ? 0 : session.day)}>
              <Text style={styles.lineTitle}>{copy.day} {session.day} · {session.name}</Text>
              <Text style={styles.lineMeta}>{session.minutes} {copy.min}</Text>
            </Pressable>
            {open ? (
              <View style={styles.dayBody}>
                <Text style={styles.lineBody}>{session.focus}</Text>
                {session.warmUp ? <Text style={styles.lineBody}>{copy.warm}: {session.warmUp}</Text> : null}
                {session.exercises.map((item) => (
                  <View key={item.name} style={styles.exercise}>
                    <Text style={styles.lineTitle}>{item.name}</Text>
                    <Text style={styles.lineBody}>{item.difficulty} · {item.equipment}</Text>
                    <Text style={styles.lineBody}>{item.sets} × {item.reps} · {item.restSeconds} {copy.sec}</Text>
                    <Text style={styles.lineBody}>{item.primary}</Text>
                    {item.instructions.map((step) => <Text key={step} style={styles.bullet}>• {step}</Text>)}
                    {full ? (
                      <>
                        <Text style={styles.lineBody}>{copy.pattern}: {item.pattern} · {item.secondary}</Text>
                        <Text style={styles.lineBody}>{copy.mistakes}: {item.mistakes.join(' · ')}</Text>
                        <Text style={styles.lineBody}>{copy.easier}: {item.easier}</Text>
                        <Text style={styles.lineBody}>{copy.progress}: {item.progression}</Text>
                      </>
                    ) : null}
                  </View>
                ))}
                {session.coolDown ? <Text style={styles.lineBody}>{copy.cool}: {session.coolDown}</Text> : null}
              </View>
            ) : null}
          </View>
        );
      })}
      {full ? (
        <>
          <Extra title={`${copy.review} ${plan.reviewWeeks}`} items={plan.progression} />
          <Extra title={copy.track} items={plan.tracking} />
          <Extra title={copy.assumptions} items={plan.assumptions} />
          <Extra title={copy.planLimits} items={plan.limitations} />
        </>
      ) : null}
      <Extra title={`📍 ${copy.safety}`} items={plan.safety} />
    </View>
  );
}

function Head({ icon, title, lead, soft }: { icon: string; title: string; lead: string; soft?: boolean }) {
  return (
    <View style={styles.head}>
      <View style={[styles.badge, soft && styles.badgeSoft]}><Text style={styles.badgeIcon}>{icon}</Text></View>
      <View style={styles.grow}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.lead}>{lead}</Text>
      </View>
    </View>
  );
}

function Section({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.lead}>{hint}</Text>
    </View>
  );
}

function Field({
  label, value, onChange, unit, icon, locked, error, editable = true, required = true,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  unit?: string;
  icon: string;
  locked?: boolean;
  error?: string;
  editable?: boolean;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}{required ? <Text style={styles.star}> *</Text> : null}</Text>
      <View style={[styles.box, error ? styles.invalid : null, locked ? styles.locked : null]}>
        <Text>{icon}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={editable && !locked}
          keyboardType={editable ? 'decimal-pad' : 'default'}
          placeholderTextColor={ink.muted}
          style={styles.input}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tab, active && styles.tabOn]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
    </Pressable>
  );
}

function Submit({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.submit, busy && styles.locked]} disabled={busy} onPress={onPress}>
      {busy ? <ActivityIndicator color={ink.white} /> : <Text style={styles.submitText}>✦  {label}</Text>}
    </Pressable>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.lead}>{text}</Text>
    </View>
  );
}

function Hello({ name, summary, hi }: { name: string; summary: string; hi: string }) {
  return (
    <View style={styles.hello}>
      <Text style={styles.lineIcon}>🤖</Text>
      <View style={styles.grow}>
        <Text style={styles.lineTitle}>{hi} {name} 👋</Text>
        <Text style={styles.lineBody}>{summary}</Text>
      </View>
    </View>
  );
}

function Macro({ icon, label, value, note }: { icon: string; label: string; value: string; note?: string }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.lineBody}>{icon} {label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
      {note ? <Text style={styles.lineBody}>{note}</Text> : null}
    </View>
  );
}

function BlockHead({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.blockHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onPress}><Text style={styles.link}>{action}</Text></Pressable>
    </View>
  );
}

function Extra({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.extra}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
    </View>
  );
}

function amount(value: string): number | null {
  const parsed = Number(value.replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function pair(rows: [string, string, string][], ar: boolean) {
  return rows.map(([id, en, arabic]) => ({ id, label: ar ? arabic : en }));
}

type Copy = ReturnType<typeof labels>;

function labels(ar: boolean) {
  return {
    title: ar ? 'الوكيل الذكي العالمي' : 'AI Global Agent',
    foodTab: ar ? 'البرنامج الغذائي' : 'Food Program',
    trainingTab: ar ? 'تعليمات التدريب' : 'Training Instructions',
    fitnessTab: ar ? 'برنامج اللياقة' : 'Fitness Program',
    foodLead: ar ? 'احصل على برنامج غذائي يناسب بياناتك وأهدافك وتفضيلاتك.' : 'Get a personalized food program based on your data, goals and preferences.',
    trainingLead: ar ? 'احصل على تعليمات تدريب تناسب مستواك وهدفك وجدولك.' : 'Get personalized training instructions based on your level, goals and schedule.',
    fitnessLead: ar ? 'احصل على برنامج أسبوعي حسب جسمك وهدفك والأدوات المتاحة.' : 'Get a weekly muscle and fitness program based on your body, goal, equipment, and limits.',
    foodResult: ar ? 'هذا برنامجك الغذائي بناءً على بياناتك.' : 'Here is your personalized food program based on your information.',
    trainingResult: ar ? 'هذه تعليمات التدريب بناءً على بياناتك.' : 'Here is your personalized training instruction based on your information.',
    fitnessResult: ar ? 'هذا برنامج اللياقة الأسبوعي بناءً على بياناتك.' : 'Here is your weekly fitness program based on your information.',
    info: ar ? 'بياناتك' : 'Your Information',
    infoHint: ar ? 'أدخل البيانات المطلوبة للحصول على خطتك.' : 'Please provide the required information to get your personalized plan.',
    trainingInfoHint: ar ? 'يأتي اسمك من ملف اللاعب. أجب عن الأسئلة لبناء جلستك.' : 'Your name comes from your player profile. Answer the questions to build your session.',
    fitnessInfoHint: ar ? 'الوزن والطول مطلوبان. العمر يأتي من ملفك عندما يكون متاحاً.' : 'Weight and height are required. Age comes from your profile when it is available.',
    name: ar ? 'الاسم' : 'Name',
    weight: ar ? 'الوزن (كغ)' : 'Weight (kg)',
    height: ar ? 'الطول (سم)' : 'Height (cm)',
    age: ar ? 'العمر' : 'Age',
    kg: ar ? 'كغ' : 'kg',
    cm: ar ? 'سم' : 'cm',
    g: ar ? 'غ' : 'g',
    min: ar ? 'د' : 'min',
    sec: ar ? 'ث' : 'sec',
    goals: ar ? 'أهدافك وتفضيلاتك' : 'Your Goals & Preferences',
    trainingGoals: ar ? 'تدريبك' : 'Your Training',
    fitnessGoals: ar ? 'إعداد التدريب' : 'Training Setup',
    goalsHint: ar ? 'أجب عن الأسئلة التالية ليُبنى البرنامج الأنسب لك.' : 'Answer the following questions to help create the best plan for you.',
    qObjective: ar ? 'ما هدفك الرئيسي؟' : 'What is your main objective?',
    qActivity: ar ? 'ما مستوى نشاطك خلال اليوم؟' : 'How active are you during the day?',
    qPreference: ar ? 'ما تفضيلك الغذائي؟' : 'What is your food preference?',
    qRestriction: ar ? 'هل لديك حساسية أو قيد غذائي؟' : 'Do you have any food allergies or restrictions?',
    tqGoal: ar ? 'ما هدف التدريب الرئيسي؟' : 'What is your main training goal?',
    tqDays: ar ? 'كم يوماً تستطيع التدريب أسبوعياً؟' : 'How many days can you train each week?',
    tqLevel: ar ? 'ما مستواك الحالي؟' : 'What is your current level?',
    tqLimit: ar ? 'هل لديك إصابة أو قيد؟' : 'Do you have any injury or limitation?',
    fqGoal: ar ? 'ما هدف اللياقة الرئيسي؟' : 'What is the main fitness goal?',
    fqLevel: ar ? 'ما خبرتك في التدريب؟' : 'What is the training experience?',
    fqEquipment: ar ? 'ما الأدوات المتاحة؟' : 'What equipment is available?',
    fqSchedule: ar ? 'كم يوماً، وكم مدة كل جلسة؟' : 'How many days, and how long is each session?',
    fqLimit: ar ? 'هل هناك إصابة أو حركة يجب تجنبها؟' : 'Any injury or movement to avoid?',
    fqExtra: ar ? 'الجنس والمركز، إن رغبت' : 'Gender and position, if you want to add them',
    minutes: ar ? 'مدة الجلسة' : 'Session length',
    position: ar ? 'المركز' : 'Position',
    genderSkip: ar ? 'الجنس اختياري' : 'Gender optional',
    generateFood: ar ? 'احصل على برنامجي الغذائي' : 'Get My Food Program',
    generateTraining: ar ? 'احصل على تعليمات التدريب' : 'Get My Training Instructions',
    generateFitness: ar ? 'أنشئ برنامج لياقتي' : 'Create My Fitness Program',
    generating: ar ? 'جارٍ إنشاء خطتك…' : 'Creating your plan…',
    fallback: ar ? 'تعذر الوصول إلى النموذج، فأُعدت هذه الخطة من إجاباتك.' : 'Ollama is not reachable, so this plan was prepared from your answers.',
    rate: ar ? 'يمكنك إنشاء عدد محدود من الخطط كل ساعة. حاول لاحقاً.' : 'You can generate a limited number of plans each hour. Try again later.',
    errWeight: ar ? 'أدخل وزناً بين 30 و 200 كغ.' : 'Enter a weight between 30 and 200 kg.',
    errHeight: ar ? 'أدخل طولاً بين 120 و 230 سم.' : 'Enter a height between 120 and 230 cm.',
    errAge: ar ? 'أدخل عمراً بين 8 و 80، أو أضف تاريخ الميلاد إلى ملفك.' : 'Enter an age between 8 and 80, or add a date of birth to your profile.',
    emptyFood: ar ? 'أدخل الوزن والطول والأهداف، ثم أنشئ البرنامج الغذائي.' : 'Fill in your weight, height and goals, then generate your food program.',
    emptyTraining: ar ? 'أجب عن أسئلة التدريب، ثم أنشئ التعليمات.' : 'Answer the training questions, then generate your instructions.',
    emptyFitness: ar ? 'أضف بيانات جسمك وإعداد التدريب، ثم أنشئ برنامج اللياقة.' : 'Add your body details and training setup, then generate your fitness program.',
    hi: ar ? 'مرحباً' : 'Hi',
    kcal: ar ? 'السعرات اليومية' : 'Daily Calories',
    kcalUnit: ar ? 'سعرة' : 'kcal',
    kcalNote: ar ? '(تقريبية)' : '(approximate)',
    protein: ar ? 'البروتين' : 'Protein',
    carbs: ar ? 'الكربوهيدرات' : 'Carbs',
    fats: ar ? 'الدهون' : 'Fats',
    meals: ar ? 'خطة الوجبات' : 'Your Meal Plan',
    viewFull: ar ? 'عرض الخطة كاملة' : 'View Full Plan',
    hideFull: ar ? 'إخفاء الخطة كاملة' : 'Hide Full Plan',
    viewFullTraining: ar ? 'عرض التعليمات كاملة' : 'View Full Instructions',
    hideFullTraining: ar ? 'إخفاء التعليمات' : 'Hide Full Instructions',
    tips: ar ? 'نصائح' : 'Pro Tips',
    sessions: ar ? 'الجلسات' : 'Sessions',
    duration: ar ? 'المدة' : 'Duration',
    intensity: ar ? 'الشدة' : 'Intensity',
    focus: ar ? 'التركيز' : 'Focus',
    perWeek: ar ? 'في الأسبوع' : 'per week',
    blocks: ar ? 'جلستك' : 'Your Session',
    statGoal: ar ? 'الهدف' : 'Goal',
    statLevel: ar ? 'المستوى' : 'Level',
    muscles: ar ? 'العضلات التي يستخدمها البرنامج' : 'Muscles this plan uses',
    week: ar ? 'البرنامج الأسبوعي' : 'Weekly Program',
    day: ar ? 'اليوم' : 'Day',
    warm: ar ? 'الإحماء' : 'Warm-up',
    cool: ar ? 'التهدئة' : 'Cool-down',
    pattern: ar ? 'النمط' : 'Pattern',
    mistakes: ar ? 'أخطاء شائعة' : 'Common mistakes',
    easier: ar ? 'خيار أسهل' : 'Easier option',
    progress: ar ? 'التقدم' : 'Progression',
    review: ar ? 'مراجعة بعد' : 'Review after',
    track: ar ? 'ما يجب متابعته' : 'What to track',
    assumptions: ar ? 'افتراضات' : 'Assumptions',
    planLimits: ar ? 'حدود هذه الخطة' : 'Limits of this plan',
    safety: ar ? 'السلامة' : 'Safety',
    foodGoals: pair([
      ['muscle', 'Build muscle & improve fitness', 'بناء العضلات وتحسين اللياقة'],
      ['fat', 'Lose body fat', 'تقليل دهون الجسم'],
      ['maintain', 'Maintain my current weight', 'المحافظة على وزني الحالي'],
      ['performance', 'Improve football performance', 'تحسين الأداء في كرة القدم'],
    ], ar),
    activities: pair([
      ['sedentary', 'Sedentary (little or no exercise)', 'قليل الحركة'],
      ['light', 'Lightly active (1–2 days/week)', 'نشاط خفيف (١–٢ يوم)'],
      ['moderate', 'Moderately active (3–5 days/week)', 'نشاط متوسط (٣–٥ أيام)'],
      ['active', 'Very active (6–7 days/week)', 'نشاط عالٍ (٦–٧ أيام)'],
      ['athlete', 'Athlete (hard training twice a day)', 'رياضي (تدريب مرتين يومياً)'],
    ], ar),
    preferences: pair([
      ['balanced', 'Balanced', 'متوازن'],
      ['protein', 'High protein', 'غني بالبروتين'],
      ['vegetarian', 'Vegetarian', 'نباتي'],
      ['lowcarb', 'Lower carbohydrate', 'أقل في الكربوهيدرات'],
    ], ar),
    restrictions: pair([
      ['none', 'None', 'لا يوجد'],
      ['dairy', 'Dairy', 'الألبان'],
      ['gluten', 'Gluten', 'الغلوتين'],
      ['nuts', 'Nuts', 'المكسرات'],
      ['seafood', 'Seafood', 'المأكولات البحرية'],
    ], ar),
    trainGoals: pair([
      ['fitness', 'Improve match fitness', 'تحسين لياقة المباراة'],
      ['power', 'Build strength and speed', 'بناء القوة والسرعة'],
      ['skill', 'Sharpen technical skills', 'صقل المهارات'],
      ['recover', 'Recover and stay available', 'التعافي والبقاء جاهزاً'],
    ], ar),
    days: pair([
      ['2', '2 days', 'يومان'],
      ['3', '3 days', '٣ أيام'],
      ['4', '4 days', '٤ أيام'],
      ['5', '5 days', '٥ أيام'],
      ['6', '6 days', '٦ أيام'],
    ], ar),
    levels: pair([
      ['beginner', 'Beginner', 'مبتدئ'],
      ['intermediate', 'Intermediate', 'متوسط'],
      ['advanced', 'Advanced', 'متقدم'],
    ], ar),
    limits: pair([
      ['none', 'None', 'لا يوجد'],
      ['knee', 'Knee', 'الركبة'],
      ['ankle', 'Ankle', 'الكاحل'],
      ['hamstring', 'Hamstring', 'أوتار الركبة'],
      ['back', 'Back', 'الظهر'],
    ], ar),
    fitGoals: pair([
      ['performance', 'Football Performance', 'أداء كرة القدم'],
      ['strength', 'Muscle Strength', 'قوة العضلات'],
      ['hypertrophy', 'Muscle Hypertrophy', 'تضخم العضلات'],
      ['fat', 'Fat Loss', 'حرق الدهون'],
      ['general', 'General Fitness', 'لياقة عامة'],
      ['speed', 'Speed and Acceleration', 'السرعة والتسارع'],
      ['power', 'Explosive Power', 'القوة الانفجارية'],
      ['endurance', 'Endurance', 'التحمل'],
      ['mobility', 'Mobility and Balance', 'المرونة والتوازن'],
    ], ar),
    equipment: pair([
      ['bodyweight', 'Bodyweight', 'وزن الجسم'],
      ['home', 'Home Equipment', 'أدوات منزلية'],
      ['gym', 'Full Gym', 'صالة كاملة'],
    ], ar),
    durations: pair([
      ['30', '30 min', '٣٠ د'],
      ['45', '45 min', '٤٥ د'],
      ['60', '60 min', '٦٠ د'],
      ['75', '75 min', '٧٥ د'],
    ], ar),
    fitLimits: pair([
      ['none', 'None', 'لا يوجد'],
      ['knee', 'Knee', 'الركبة'],
      ['ankle', 'Ankle', 'الكاحل'],
      ['hamstring', 'Hamstring', 'أوتار الركبة'],
      ['back', 'Back', 'الظهر'],
      ['shoulder', 'Shoulder', 'الكتف'],
    ], ar),
    genders: pair([
      ['', 'Gender optional', 'الجنس اختياري'],
      ['female', 'Female', 'أنثى'],
      ['male', 'Male', 'ذكر'],
    ], ar),
  };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101114' },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  tabs: { flexDirection: 'row', gap: 8, backgroundColor: '#1b1e24', borderRadius: 16, padding: 6 },
  tab: { minHeight: 36, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: ink.pink },
  tabText: { color: '#d5d8e0', fontSize: 13, fontWeight: '800' },
  tabTextOn: { color: ink.white },
  grid: { gap: 14 },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  card: { flex: 1, backgroundColor: '#171a1f', borderRadius: 18, borderWidth: 1, borderColor: '#2a2e36', padding: 14, gap: 10 },
  head: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  badge: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#243024', alignItems: 'center', justifyContent: 'center' },
  badgeSoft: { backgroundColor: '#2a2230' },
  badgeIcon: { fontSize: 20 },
  cardTitle: { color: ink.white, fontSize: 20, fontWeight: '800' },
  lead: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  section: { gap: 4, marginTop: 6 },
  sectionTitle: { color: ink.white, fontSize: 16, fontWeight: '800' },
  field: { gap: 6 },
  fieldLabel: { color: ink.muted, fontSize: 12, fontWeight: '700' },
  star: { color: ink.pink },
  box: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#323844', backgroundColor: '#101318', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  invalid: { borderColor: '#ff8b8b' },
  locked: { opacity: 0.6 },
  input: { flex: 1, color: ink.white, fontSize: 15, paddingVertical: 8 },
  unit: { color: ink.muted, fontWeight: '700' },
  error: { color: '#ffb4b4', fontSize: 12 },
  submit: { minHeight: 46, borderRadius: 12, backgroundColor: ink.pink, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  submitText: { color: ink.white, fontWeight: '800', fontSize: 14 },
  note: { color: '#f0d48a', fontSize: 13, lineHeight: 18 },
  empty: { minHeight: 220, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#3a4150', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyIcon: { fontSize: 42 },
  result: { gap: 12 },
  hello: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macro: { width: '48%', backgroundColor: '#101318', borderRadius: 14, borderWidth: 1, borderColor: '#2a2e36', padding: 10, gap: 4 },
  macroValue: { color: ink.white, fontSize: 18, fontWeight: '800' },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  link: { color: ink.pink, fontWeight: '800', fontSize: 12 },
  line: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#2a2e36', paddingBottom: 8 },
  lineIcon: { fontSize: 18, width: 28 },
  grow: { flex: 1, gap: 2 },
  lineTitle: { color: ink.white, fontWeight: '800', fontSize: 14 },
  lineBody: { color: ink.muted, fontSize: 12, lineHeight: 17 },
  lineMeta: { color: ink.white, fontSize: 12, fontWeight: '800' },
  extra: { gap: 4 },
  bullet: { color: '#d5d8e0', fontSize: 13, lineHeight: 18 },
  disclaimer: { color: ink.muted, fontSize: 12, lineHeight: 17 },
  day: { borderWidth: 1, borderColor: '#2a2e36', borderRadius: 12, overflow: 'hidden' },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, padding: 10 },
  dayBody: { paddingHorizontal: 10, paddingBottom: 10, gap: 6 },
  exercise: { gap: 3, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#2a2e36' },
});
