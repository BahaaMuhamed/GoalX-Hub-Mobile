import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { mediaUrl } from '@/api/platform';
import {
  listPublicAcademies,
  registrationWindow,
  submitFreeSquad,
  submitRegistration,
  type PublicAcademy,
  type PublicSeason,
} from '@/api/public';
import { Banner } from '@/components/Banner';
import { BrandMark } from '@/components/BrandMark';
import { LangSwitch } from '@/components/LangSwitch';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { useLocale } from '@/i18n/LocaleContext';
import type { Copy } from '@/i18n/copy';
import { colors, spacing, wash } from '@/theme';

type PlayerType = 'ACADEMY_PLAYER' | 'FREE_PLAYER';
type Step = 1 | 2 | 3 | 4 | 5;
type Mate = { fullName: string; position: string; dateOfBirth: string; phone: string };
type Draft = {
  playerType: PlayerType;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  gender: '' | 'Male' | 'Female';
  phone: string;
  country: string;
  city: string;
  preferredPosition: string;
  academyId: string;
  seasonId: string;
  teamId: string;
  mates: Mate[];
};

const POSITIONS = [
  { value: 'Goalkeeper', en: 'Goalkeeper', ar: 'حارس مرمى' },
  { value: 'Center Back', en: 'Center Back', ar: 'قلب دفاع' },
  { value: 'Full Back', en: 'Full Back', ar: 'ظهير' },
  { value: 'Defensive Midfielder', en: 'Defensive Midfielder', ar: 'وسط مدافع' },
  { value: 'Central Midfielder', en: 'Central Midfielder', ar: 'وسط' },
  { value: 'Attacking Midfielder', en: 'Attacking Midfielder', ar: 'وسط مهاجم' },
  { value: 'Winger', en: 'Winger', ar: 'جناح' },
  { value: 'Striker', en: 'Striker', ar: 'مهاجم' },
];

const COUNTRIES = [
  { value: 'Egypt', en: 'Egypt', ar: 'مصر' },
  { value: 'United Arab Emirates', en: 'United Arab Emirates', ar: 'الإمارات' },
  { value: 'Saudi Arabia', en: 'Saudi Arabia', ar: 'السعودية' },
  { value: 'Qatar', en: 'Qatar', ar: 'قطر' },
  { value: 'Jordan', en: 'Jordan', ar: 'الأردن' },
  { value: 'Morocco', en: 'Morocco', ar: 'المغرب' },
  { value: 'Tunisia', en: 'Tunisia', ar: 'تونس' },
  { value: 'England', en: 'England', ar: 'إنجلترا' },
  { value: 'Spain', en: 'Spain', ar: 'إسبانيا' },
  { value: 'France', en: 'France', ar: 'فرنسا' },
  { value: 'Germany', en: 'Germany', ar: 'ألمانيا' },
  { value: 'Italy', en: 'Italy', ar: 'إيطاليا' },
  { value: 'Brazil', en: 'Brazil', ar: 'البرازيل' },
  { value: 'Argentina', en: 'Argentina', ar: 'الأرجنتين' },
  { value: 'United States', en: 'United States', ar: 'الولايات المتحدة' },
];

const emptyDraft = (): Draft => ({
  playerType: 'ACADEMY_PLAYER',
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  country: '',
  city: '',
  preferredPosition: '',
  academyId: '',
  seasonId: '',
  teamId: '',
  mates: [],
});

export default function RegisterScreen() {
  const router = useRouter();
  const { lang, rtl, text } = useLocale();
  const align = rtl ? 'right' : 'left';
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [academies, setAcademies] = useState<PublicAcademy[]>([]);
  const [academyQuery, setAcademyQuery] = useState('');
  const [loadingAcademies, setLoadingAcademies] = useState(true);
  const [windowOpen, setWindowOpen] = useState(false);
  const [seasons, setSeasons] = useState<PublicSeason[]>([]);
  const [result, setResult] = useState<{ academy: boolean; academyName: string; id: string } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listPublicAcademies(), registrationWindow()]).then(([rows, window]) => {
      if (!active) return;
      setAcademies(rows);
      setWindowOpen(window.open);
      setSeasons(window.seasons);
      setLoadingAcademies(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedAcademy = academies.find((item) => item.id === draft.academyId);
  const selectedSeason = seasons.find((item) => item.id === draft.seasonId);
  const filteredAcademies = academies.filter((item) => {
    const query = academyQuery.trim().toLowerCase();
    if (!query) return true;
    return `${item.name} ${item.city} ${item.country}`.toLowerCase().includes(query);
  });

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function updateMate(index: number, partial: Partial<Mate>) {
    setDraft((current) => ({
      ...current,
      mates: current.mates.map((mate, item) => (item === index ? { ...mate, ...partial } : mate)),
    }));
  }

  function choose(type: PlayerType) {
    if (type === 'FREE_PLAYER' && !windowOpen) return;
    patch({ playerType: type, academyId: type === 'FREE_PLAYER' ? '' : draft.academyId });
    setError('');
  }

  function chooseSeason(seasonId: string) {
    const season = seasons.find((item) => item.id === seasonId);
    const extras = Math.max(0, playerLimit(season) - 1);
    patch({
      seasonId,
      teamId: '',
      mates: Array.from({ length: extras }, () => ({ fullName: '', position: '', dateOfBirth: '', phone: '' })),
    });
  }

  function validate(current: Step): Record<string, string> {
    const next: Record<string, string> = {};
    const missing = (key: string, value: string) => {
      if (!value.trim()) next[key] = text.required;
    };
    if (current === 1) {
      if (draft.playerType === 'FREE_PLAYER' && !windowOpen) next.playerType = text.freeClosed;
      return next;
    }
    if (current === 2) {
      missing('firstName', draft.firstName);
      missing('lastName', draft.lastName);
      if (!/^[A-Za-z0-9._]{3,24}$/.test(draft.username.trim())) next.username = text.badUsername;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) next.email = text.badEmail;
      if (draft.password.length < 8) next.password = text.badPassword;
      if (draft.password !== draft.confirmPassword) next.confirmPassword = text.badMatch;
      if (!pastDate(draft.dateOfBirth)) next.dateOfBirth = text.badDob;
      if (!draft.gender) next.gender = text.required;
      if (draft.phone.replace(/\D/g, '').length < 7) next.phone = text.badPhone;
      if (!draft.country) next.country = text.required;
      if (draft.city.trim().length < 2) next.city = text.required;
      return next;
    }
    if (current === 3) {
      if (!draft.preferredPosition) next.preferredPosition = text.required;
      return next;
    }
    if (current === 4) {
      if (draft.playerType === 'ACADEMY_PLAYER') {
        if (!draft.academyId) next.academyId = text.needAcademy;
        return next;
      }
      if (!draft.seasonId) next.seasonId = text.needSeason;
      if (!draft.teamId) next.teamId = text.needTeam;
      const incomplete = draft.mates.some(
        (mate) => !mate.fullName.trim() || !mate.position || !pastDate(mate.dateOfBirth) || mate.phone.replace(/\D/g, '').length < 7,
      );
      if (incomplete) next.mates = text.needMates;
    }
    return next;
  }

  async function next() {
    const problems = validate(step);
    setFieldErrors(problems);
    setError('');
    if (Object.keys(problems).length) return;
    if (step < 5) {
      setStep((current) => (current + 1) as Step);
      return;
    }
    await send();
  }

  async function send() {
    setSubmitting(true);
    try {
      const academyName = selectedAcademy?.name || '';
      if (draft.playerType === 'FREE_PLAYER') {
        await submitFreeSquad(draft.seasonId, {
          teamId: draft.teamId,
          players: [
            {
              fullName: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
              position: draft.preferredPosition,
              dateOfBirth: draft.dateOfBirth,
              phone: draft.phone.trim(),
              captain: true,
              email: draft.email.trim(),
            },
            ...draft.mates.map((mate) => ({
              fullName: mate.fullName.trim(),
              position: mate.position,
              dateOfBirth: mate.dateOfBirth,
              phone: mate.phone.trim(),
              captain: false,
            })),
          ],
        });
      }
      const created = await submitRegistration({
        playerType: draft.playerType,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        username: draft.username.trim(),
        email: draft.email.trim(),
        password: draft.password,
        dateOfBirth: draft.dateOfBirth,
        gender: draft.gender,
        phone: draft.phone.trim(),
        country: draft.country,
        city: draft.city.trim(),
        preferredPosition: draft.preferredPosition,
        academyId: draft.playerType === 'ACADEMY_PLAYER' ? draft.academyId : null,
        organizationScope: draft.playerType === 'ACADEMY_PLAYER' ? 'ACADEMY' : 'MAIN_PLATFORM',
        accountStatus: draft.playerType === 'ACADEMY_PLAYER' ? 'PENDING_ACADEMY_APPROVAL' : 'PENDING_PLATFORM_APPROVAL',
      });
      setResult({
        academy: draft.playerType === 'ACADEMY_PLAYER',
        academyName: created.academyName || academyName,
        id: created.id,
      });
    } catch (caught) {
      setError(errorMessage(caught, lang === 'ar' ? 'تعذر إرسال التسجيل.' : 'Registration failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>{result.academy ? text.pendingAcademy : text.pendingPlatform}</Text>
          <Text style={[styles.title, lang === 'en' && styles.upper]}>{text.submitted}</Text>
          <Text style={[styles.lead, { textAlign: align }]}>{result.academy ? text.sentAcademy : text.sentPlatform}</Text>
          {result.academyName ? <Text style={styles.reference}>{result.academyName}</Text> : null}
          {result.id ? <Text style={styles.reference}>{result.id}</Text> : null}
          <PrimaryButton label={text.backToLogin} onPress={() => router.replace('/login')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <LangSwitch />
          <Text style={styles.kicker}>{text.signupKicker}</Text>
          <Text style={[styles.title, lang === 'en' && styles.upper]}>{text.signupTitle}</Text>
          <Text style={[styles.lead, { textAlign: align }]}>{text.signupLead}</Text>
          <Stepper labels={text.steps} step={step} />
          {error ? <Banner message={error} /> : null}

          {step === 1 ? (
            <View style={styles.block}>
              <Text style={[styles.question, { textAlign: align }]}>{text.typeQ}</Text>
              <Choice
                selected={draft.playerType === 'ACADEMY_PLAYER'}
                title={text.academy}
                hint={text.academyHint}
                icon="home"
                align={align}
                onPress={() => choose('ACADEMY_PLAYER')}
              />
              <Choice
                selected={draft.playerType === 'FREE_PLAYER'}
                title={text.free}
                hint={text.freeHint}
                note={windowOpen ? '' : text.freeClosed}
                icon="person"
                dimmed={!windowOpen}
                align={align}
                onPress={() => choose('FREE_PLAYER')}
              />
              {fieldErrors.playerType ? <Text style={styles.fieldError}>{fieldErrors.playerType}</Text> : null}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.block}>
              <TextField label={text.firstName} value={draft.firstName} onChangeText={(firstName) => patch({ firstName })} autoCapitalize="words" autoComplete="name" align={align} error={fieldErrors.firstName} />
              <TextField label={text.lastName} value={draft.lastName} onChangeText={(lastName) => patch({ lastName })} autoCapitalize="words" autoComplete="name" align={align} error={fieldErrors.lastName} />
              <TextField label={text.username} value={draft.username} onChangeText={(username) => patch({ username })} autoComplete="username" align={align} error={fieldErrors.username} />
              <TextField label={text.email} value={draft.email} onChangeText={(email) => patch({ email })} keyboardType="email-address" autoComplete="email" align={align} error={fieldErrors.email} />
              <TextField label={text.password} value={draft.password} onChangeText={(password) => patch({ password })} secureTextEntry={!showPassword} autoComplete="password" align={align} error={fieldErrors.password} />
              <TextField label={text.confirm} value={draft.confirmPassword} onChangeText={(confirmPassword) => patch({ confirmPassword })} secureTextEntry={!showPassword} autoComplete="password" align={align} error={fieldErrors.confirmPassword} />
              <Pressable onPress={() => setShowPassword((current) => !current)}>
                <Text style={[styles.link, { textAlign: align }]}>{showPassword ? text.hidePassword : text.showPassword}</Text>
              </Pressable>
              <TextField label={text.dob} value={draft.dateOfBirth} onChangeText={(dateOfBirth) => patch({ dateOfBirth })} placeholder="2008-04-12" align={align} error={fieldErrors.dateOfBirth} />
              <Text style={[styles.label, { textAlign: align }]}>{text.gender}</Text>
              <View style={styles.chips}>
                {(['Male', 'Female'] as const).map((gender) => (
                  <Chip key={gender} label={gender === 'Male' ? text.male : text.female} selected={draft.gender === gender} onPress={() => patch({ gender })} />
                ))}
              </View>
              {fieldErrors.gender ? <Text style={[styles.fieldError, { textAlign: align }]}>{fieldErrors.gender}</Text> : null}
              <TextField label={text.phone} value={draft.phone} onChangeText={(phone) => patch({ phone })} keyboardType="phone-pad" autoComplete="tel" align={align} error={fieldErrors.phone} />
              <Text style={[styles.label, { textAlign: align }]}>{text.country}</Text>
              <View style={styles.chips}>
                {COUNTRIES.map((country) => (
                  <Chip key={country.value} label={lang === 'ar' ? country.ar : country.en} selected={draft.country === country.value} onPress={() => patch({ country: country.value })} />
                ))}
              </View>
              {fieldErrors.country ? <Text style={[styles.fieldError, { textAlign: align }]}>{fieldErrors.country}</Text> : null}
              <TextField label={text.city} value={draft.city} onChangeText={(city) => patch({ city })} autoCapitalize="words" align={align} error={fieldErrors.city} />
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.block}>
              <Text style={[styles.question, { textAlign: align }]}>{text.position}</Text>
              <View style={styles.chips}>
                {POSITIONS.map((position) => (
                  <Chip
                    key={position.value}
                    label={lang === 'ar' ? position.ar : position.en}
                    selected={draft.preferredPosition === position.value}
                    onPress={() => patch({ preferredPosition: position.value })}
                  />
                ))}
              </View>
              {fieldErrors.preferredPosition ? <Text style={[styles.fieldError, { textAlign: align }]}>{fieldErrors.preferredPosition}</Text> : null}
            </View>
          ) : null}

          {step === 4 && draft.playerType === 'ACADEMY_PLAYER' ? (
            <View style={styles.block}>
              <Text style={[styles.question, { textAlign: align }]}>{text.academyTitle}</Text>
              <Text style={[styles.lead, { textAlign: align }]}>{text.academyHintLong}</Text>
              <TextField label={text.academySearch} value={academyQuery} onChangeText={setAcademyQuery} align={align} />
              {loadingAcademies ? <ActivityIndicator color={colors.greenBright} /> : null}
              {!loadingAcademies && !filteredAcademies.length ? <Text style={styles.muted}>{text.academyEmpty}</Text> : null}
              {filteredAcademies.map((academy) => {
                const selected = academy.id === draft.academyId;
                const accent = academy.primaryColor || colors.green;
                return (
                  <Pressable
                    key={academy.id}
                    onPress={() => patch({ academyId: academy.id })}
                    style={[styles.academy, selected && { borderColor: accent, backgroundColor: wash(accent, 0.16) }]}
                  >
                    <BrandMark size={42} uri={mediaUrl(academy.logoUrl)} />
                    <View style={styles.academyText}>
                      <Text style={[styles.academyName, { textAlign: align }]}>{academy.name}</Text>
                      <Text style={[styles.muted, { textAlign: align }]}>{[academy.city, academy.country].filter(Boolean).join(', ')}</Text>
                    </View>
                  </Pressable>
                );
              })}
              {fieldErrors.academyId ? <Text style={[styles.fieldError, { textAlign: align }]}>{fieldErrors.academyId}</Text> : null}
            </View>
          ) : null}

          {step === 4 && draft.playerType === 'FREE_PLAYER' ? (
            <View style={styles.block}>
              <Text style={[styles.question, { textAlign: align }]}>{text.teamTitle}</Text>
              <Text style={[styles.lead, { textAlign: align }]}>{text.teamHint}</Text>
              {!seasons.length ? <Text style={styles.muted}>{text.noSeasons}</Text> : null}
              <Text style={[styles.label, { textAlign: align }]}>{text.season}</Text>
              <View style={styles.chips}>
                {seasons.map((season) => (
                  <Chip key={season.id} label={season.name} selected={draft.seasonId === season.id} onPress={() => chooseSeason(season.id)} />
                ))}
              </View>
              {fieldErrors.seasonId ? <Text style={styles.fieldError}>{fieldErrors.seasonId}</Text> : null}
              {selectedSeason ? (
                <>
                  <Text style={[styles.label, { textAlign: align }]}>{text.team}</Text>
                  {!selectedSeason.teams.length ? <Text style={styles.muted}>{text.noTeams}</Text> : null}
                  <View style={styles.chips}>
                    {selectedSeason.teams.map((team) => (
                      <Chip key={team.id} label={team.name} selected={draft.teamId === team.id} onPress={() => patch({ teamId: team.id })} />
                    ))}
                  </View>
                </>
              ) : null}
              {fieldErrors.teamId ? <Text style={styles.fieldError}>{fieldErrors.teamId}</Text> : null}
              {draft.mates.map((mate, index) => (
                <View key={index} style={styles.mate}>
                  <Text style={styles.academyName}>{text.playerN} {index + 2}</Text>
                  <TextField label={text.reviewName} value={mate.fullName} onChangeText={(fullName) => updateMate(index, { fullName })} autoCapitalize="words" align={align} />
                  <View style={styles.chips}>
                    {POSITIONS.map((position) => (
                      <Chip
                        key={position.value}
                        label={lang === 'ar' ? position.ar : position.en}
                        selected={mate.position === position.value}
                        onPress={() => updateMate(index, { position: position.value })}
                      />
                    ))}
                  </View>
                  <TextField label={text.dob} value={mate.dateOfBirth} onChangeText={(dateOfBirth) => updateMate(index, { dateOfBirth })} placeholder="2008-04-12" align={align} />
                  <TextField label={text.phone} value={mate.phone} onChangeText={(phone) => updateMate(index, { phone })} keyboardType="phone-pad" align={align} />
                </View>
              ))}
              {fieldErrors.mates ? <Text style={styles.fieldError}>{fieldErrors.mates}</Text> : null}
            </View>
          ) : null}

          {step === 5 ? (
            <View style={styles.block}>
              <ReviewRow label={text.reviewType} value={draft.playerType === 'ACADEMY_PLAYER' ? text.academy : text.free} align={align} />
              <ReviewRow label={text.reviewName} value={`${draft.firstName} ${draft.lastName}`} align={align} />
              <ReviewRow label={text.username} value={draft.username} align={align} />
              <ReviewRow label={text.email} value={draft.email} align={align} />
              <ReviewRow label={text.phone} value={draft.phone} align={align} />
              <ReviewRow label={text.reviewLocation} value={`${draft.city}, ${countryLabel(draft.country, lang)}`} align={align} />
              <ReviewRow label={text.reviewPosition} value={positionLabel(draft.preferredPosition, lang)} align={align} />
              {draft.playerType === 'ACADEMY_PLAYER' ? (
                <ReviewRow label={text.reviewAcademy} value={selectedAcademy?.name || ''} align={align} />
              ) : (
                <ReviewRow label={text.reviewTeam} value={selectedSeason?.teams.find((team) => team.id === draft.teamId)?.name || ''} align={align} />
              )}
              <ReviewRow
                label={text.reviewStatus}
                value={draft.playerType === 'ACADEMY_PLAYER' ? 'PENDING_ACADEMY_APPROVAL' : 'PENDING_PLATFORM_APPROVAL'}
                align={align}
              />
              {draft.playerType === 'FREE_PLAYER' ? <Text style={styles.lead}>{text.freeNote}</Text> : null}
              <View style={styles.edits}>
                <Pressable onPress={() => setStep(2)}><Text style={styles.link}>{text.editProfile}</Text></Pressable>
                <Pressable onPress={() => setStep(3)}><Text style={styles.link}>{text.editFootball}</Text></Pressable>
                <Pressable onPress={() => setStep(4)}><Text style={styles.link}>{text.editAcademy}</Text></Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.nav}>
            <Pressable
              style={styles.outline}
              onPress={() => {
                setError('');
                setFieldErrors({});
                if (step === 1) router.replace('/login');
                else setStep((current) => (current - 1) as Step);
              }}
            >
              <Text style={styles.outlineLabel}>{step === 1 ? text.login : text.back}</Text>
            </Pressable>
            <PrimaryButton style={styles.next} label={step === 5 ? text.submit : text.continue} onPress={next} loading={submitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stepper({ labels, step }: { labels: Copy['steps']; step: Step }) {
  return (
    <View style={styles.progress}>
      <View style={styles.track} />
      {labels.map((label, index) => {
        const number = index + 1;
        const active = step === number;
        const done = step > number;
        return (
          <View key={label} style={styles.step}>
            <View style={[styles.num, (active || done) && styles.numOn]}>
              <Text style={[styles.numText, (active || done) && styles.numTextOn]}>{String(number).padStart(2, '0')}</Text>
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelOn]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Choice({
  selected,
  title,
  hint,
  note,
  icon,
  dimmed,
  align,
  onPress,
}: {
  selected: boolean;
  title: string;
  hint: string;
  note?: string;
  icon: 'home' | 'person';
  dimmed?: boolean;
  align: 'left' | 'right';
  onPress: () => void;
}) {
  return (
    <Pressable disabled={dimmed} onPress={onPress} style={[styles.choice, selected && styles.choiceOn, dimmed && styles.dimmed]}>
      {icon === 'home' ? <HomeIcon color={selected ? colors.greenBright : '#d8f6c8'} /> : <PersonIcon color="#d4af37" />}
      <Text style={[styles.choiceTitle, { textAlign: align }]}>{title}</Text>
      <Text style={[styles.choiceHint, { textAlign: align }]}>{hint}</Text>
      {note ? <Text style={[styles.note, { textAlign: align }]}>{note}</Text> : null}
    </Pressable>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{label}</Text>
    </Pressable>
  );
}

function ReviewRow({ label, value, align }: { label: string; value: string; align: 'left' | 'right' }) {
  return (
    <View style={styles.review}>
      <Text style={[styles.muted, { textAlign: align }]}>{label}</Text>
      <Text style={[styles.academyName, { textAlign: align }]}>{value}</Text>
    </View>
  );
}

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={styles.icon}>
      <View style={[styles.roof, { borderBottomColor: color }]} />
      <View style={[styles.house, { borderColor: color }]} />
    </View>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <View style={styles.icon}>
      <View style={[styles.head, { borderColor: color }]} />
      <View style={[styles.shoulders, { borderColor: color }]} />
    </View>
  );
}

function pastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  return date.getTime() < Date.now() && year >= 1950;
}

function playerLimit(season: PublicSeason | undefined): number {
  return Math.max(1, Math.min(6, season?.playersPerTeam || 5));
}

function countryLabel(value: string, lang: 'en' | 'ar'): string {
  const match = COUNTRIES.find((item) => item.value === value);
  if (!match) return value;
  return lang === 'ar' ? match.ar : match.en;
}

function positionLabel(value: string, lang: 'en' | 'ar'): string {
  const match = POSITIONS.find((item) => item.value === value);
  if (!match) return value;
  return lang === 'ar' ? match.ar : match.en;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  kicker: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  upper: { textTransform: 'uppercase' },
  lead: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  progress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  track: {
    position: 'absolute',
    top: 16,
    left: '8%',
    right: '8%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  num: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#151918',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numOn: { backgroundColor: colors.green, borderColor: colors.green },
  numText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  numTextOn: { color: '#04140c' },
  stepLabel: { color: colors.faint, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  stepLabelOn: { color: colors.white },
  block: { gap: spacing.md },
  question: { color: colors.gold, fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  choice: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: 6,
  },
  choiceOn: {
    borderColor: colors.green,
    backgroundColor: '#0d2418',
  },
  dimmed: { opacity: 0.45 },
  choiceTitle: { color: colors.white, fontSize: 22, fontWeight: '800' },
  choiceHint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  note: { color: colors.gold, fontSize: 13, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cardRaised,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: '#14392c', borderColor: colors.green },
  chipLabel: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  chipLabelOn: { color: colors.greenBright },
  link: { color: colors.gold, fontSize: 14, fontWeight: '700' },
  fieldError: { color: colors.danger, fontSize: 12 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  academy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  academyText: { flex: 1, gap: 2 },
  academyName: { color: colors.white, fontSize: 16, fontWeight: '800' },
  mate: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.card,
  },
  review: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  edits: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  outline: {
    minHeight: 52,
    minWidth: 108,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  outlineLabel: { color: colors.white, fontSize: 16, fontWeight: '700' },
  next: { flex: 1, borderRadius: 999 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'flex-end' },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  house: { width: 18, height: 12, borderWidth: 1.6, borderTopWidth: 0, marginTop: -1 },
  head: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.6, marginBottom: 3 },
  shoulders: { width: 22, height: 10, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderWidth: 1.6, borderBottomWidth: 0 },
  reference: { color: colors.gold, fontSize: 14, fontWeight: '700' },
});
