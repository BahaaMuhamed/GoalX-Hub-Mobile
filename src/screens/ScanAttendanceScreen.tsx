import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import { router, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/errors';
import { scanStaffQr, scanTrainingQr } from '@/api/scanAttendance';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { ink } from '@/components/DirectoryChrome';
import { ScreenBack } from '@/components/ScreenBack';
import { useLocale } from '@/i18n/LocaleContext';

type Audience = 'player' | 'staff';
type Result = { ok: boolean; title: string; message: string };

function audienceFor(role: string): Audience | null {
  if (role === 'PLAYER') return 'player';
  if (role === 'COACH' || role === 'ADMINISTRATIVE') return 'staff';
  return null;
}

function qrKind(value: string): 'train' | 'staff' | 'unknown' {
  const token = value.toUpperCase();
  if (token.includes('STAFF:')) return 'staff';
  if (token.includes('TRAIN:')) return 'train';
  return 'unknown';
}

function clock(value: string): string {
  const match = value.match(/(\d{2}:\d{2})/);
  return match ? match[1] : '';
}

export function ScanAttendanceScreen() {
  const { lang } = useLocale();
  const ar = lang === 'ar';
  const { profile } = useAuth();
  const audience = audienceFor(profile?.role ?? '');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOn, setCameraOn] = useState(false);
  const [armed, setArmed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const busy = useRef(false);

  const t = ar
    ? {
        title: 'مسح الحضور',
        playerHint: 'افتح الكاميرا وامسح رمز تدريب الجلسة. بعد نجاح المسح يتم تسجيل حضورك وخصم حصة واحدة.',
        staffHint: 'افتح الكاميرا وامسح رمز حضور الفرع. يتم تسجيل حضورك فقط، بدون خصم حصص.',
        denied: 'هذا الحساب لا يملك صلاحية مسح الحضور.',
        open: 'فتح الكاميرا',
        close: 'إغلاق الكاميرا',
        again: 'مسح مرة أخرى',
        checking: 'جارٍ التحقق من الرمز…',
        cameraNeed: 'اسمح للكاميرا حتى تتمكن من مسح رمز الحضور.',
        cameraDenied: 'تم رفض إذن الكاميرا. فعّل الكاميرا من إعدادات الهاتف ثم أعد المحاولة.',
        locationDenied: 'يلزم موقعك لتسجيل حضور الموظف داخل الفرع.',
        wrongStaff: 'هذا الرمز خاص بحضور الموظفين. امسح رمز تدريب الجلسة.',
        wrongTrain: 'هذا الرمز خاص بتدريب اللاعبين. امسح رمز حضور الفرع.',
        playerOk: 'تم تسجيل الحضور',
        playerBody: (left: number | null) =>
          left == null
            ? 'تم حفظ حضورك على جلسة التدريب. يظهر الصف في صفحة التدريب، وبعد اكتمال الجلسة في حضور التدريب.'
            : `تم تسجيل الحضور وخصم حصة واحدة. الحصص المتبقية: ${left}. يظهر الصف في صفحة التدريب، وبعد اكتمال الجلسة في حضور التدريب.`,
        staffIn: 'تم تسجيل الحضور',
        staffOut: 'تم تسجيل الانتهاء',
        staffInBody: (branch: string, time: string) =>
          `تم تسجيل حضورك${branch ? ` في ${branch}` : ''}${time ? ` الساعة ${time}` : ''}. لم يتم خصم أي حصص. يظهر السجل في صفحة حضور الموظفين.`,
        staffOutBody: (branch: string, time: string) =>
          `تم تسجيل وقت الانتهاء${branch ? ` في ${branch}` : ''}${time ? ` الساعة ${time}` : ''}.`,
        viewPlayer: 'عرض تدريبي',
        viewStaff: 'عرض حضور الموظفين',
        failed: 'تعذر تسجيل الحضور',
      }
    : {
        title: 'Scan attendance',
        playerHint: 'Open the camera and scan the training QR. A successful scan records your attendance and uses one session.',
        staffHint: 'Open the camera and scan the branch attendance QR. This records your attendance only. No session is deducted.',
        denied: 'This account cannot scan attendance.',
        open: 'Open camera',
        close: 'Close camera',
        again: 'Scan again',
        checking: 'Checking this QR…',
        cameraNeed: 'Allow the camera so you can scan the attendance QR.',
        cameraDenied: 'Camera permission was denied. Enable the camera in phone settings, then try again.',
        locationDenied: 'Your location is required so employee attendance is recorded at the branch.',
        wrongStaff: 'This QR is for employee attendance. Scan the training session QR.',
        wrongTrain: 'This QR is for a player training session. Scan the branch attendance QR.',
        playerOk: 'Attendance recorded',
        playerBody: (left: number | null) =>
          left == null
            ? 'Your attendance is saved on this training session. It shows on My training, and on Training attendance after the session is completed.'
            : `Attendance recorded and one session was used. Remaining sessions: ${left}. The row is on My training, and on Training attendance after the session is completed.`,
        staffIn: 'Attendance recorded',
        staffOut: 'Finish time recorded',
        staffInBody: (branch: string, time: string) =>
          `You are checked in${branch ? ` at ${branch}` : ''}${time ? ` at ${time}` : ''}. No session was deducted. The row is on the employee attendance page.`,
        staffOutBody: (branch: string, time: string) =>
          `Finish time recorded${branch ? ` at ${branch}` : ''}${time ? ` at ${time}` : ''}.`,
        viewPlayer: 'View my training',
        viewStaff: 'View employee attendance',
        failed: 'Attendance was not recorded',
      };

  const finish = useCallback((next: Result) => {
    setChecking(false);
    setResult(next);
  }, []);

  const onScan = useCallback(async (scan: BarcodeScanningResult) => {
    if (busy.current || !audience) return;
    const token = scan.data?.trim();
    if (!token) return;
    busy.current = true;
    setArmed(false);
    setCameraOn(false);
    setResult(null);
    setChecking(true);

    const kind = qrKind(token);
    if (audience === 'player' && kind === 'staff') {
      finish({ ok: false, title: t.failed, message: t.wrongStaff });
      return;
    }
    if (audience === 'staff' && kind === 'train') {
      finish({ ok: false, title: t.failed, message: t.wrongTrain });
      return;
    }

    try {
      if (audience === 'player') {
        const saved = await scanTrainingQr(token);
        finish({
          ok: true,
          title: t.playerOk,
          message: ar ? t.playerBody(saved.remainingSessions) : saved.message || t.playerBody(saved.remainingSessions),
        });
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        finish({ ok: false, title: t.failed, message: t.locationDenied });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const saved = await scanStaffQr(token, position.coords.latitude, position.coords.longitude);
      const time = clock(saved.action === 'CHECK_OUT' ? saved.finishTime : saved.attendanceTime);
      const checkedOut = saved.action === 'CHECK_OUT';
      finish({
        ok: true,
        title: checkedOut ? t.staffOut : t.staffIn,
        message: checkedOut ? t.staffOutBody(saved.branchName, time) : t.staffInBody(saved.branchName, time),
      });
    } catch (error) {
      finish({ ok: false, title: t.failed, message: errorMessage(error, t.failed) });
    }
  }, [ar, audience, finish, t]);

  async function openCamera() {
    setResult(null);
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        setResult({ ok: false, title: t.failed, message: t.cameraDenied });
        return;
      }
    }
    busy.current = false;
    setArmed(true);
    setCameraOn(true);
  }

  function scanAgain() {
    setResult(null);
    void openCamera();
  }

  const recordHref = audience === 'staff' ? '/screens/staff-attendance' : '/screens/my-training';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenBack />
        <Text style={[styles.title, ar && styles.end]}>{t.title}</Text>
        <Text style={[styles.hint, ar && styles.end]}>
          {audience === 'staff' ? t.staffHint : audience === 'player' ? t.playerHint : t.denied}
        </Text>

        {audience && !cameraOn && !checking && !result ? (
          <Pressable style={styles.pink} onPress={() => void openCamera()}>
            <Text style={styles.pinkText}>{t.open}</Text>
          </Pressable>
        ) : null}

        {permission && !permission.granted && !cameraOn ? <Text style={styles.hint}>{t.cameraNeed}</Text> : null}

        {cameraOn ? (
          <View style={styles.preview}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={armed ? onScan : undefined}
            />
            <View style={styles.frame} pointerEvents="none" />
            <View style={styles.closeRow}>
              <Pressable style={styles.pink} onPress={() => { setArmed(false); setCameraOn(false); }}>
                <Text style={styles.pinkText}>{t.close}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {checking ? (
          <View style={styles.card}>
            <ActivityIndicator color={ink.pink} />
            <Text style={styles.hint}>{t.checking}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={[styles.card, result.ok ? styles.goodCard : styles.badCard]}>
            <Text style={[styles.cardTitle, result.ok ? styles.good : styles.bad]}>{result.title}</Text>
            <Text style={styles.message}>{result.message}</Text>
            <View style={styles.actions}>
              {result.ok ? (
                <Pressable style={styles.pink} onPress={() => router.push(recordHref as Href)}>
                  <Text style={styles.pinkText}>{audience === 'staff' ? t.viewStaff : t.viewPlayer}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.pink} onPress={scanAgain}>
                <Text style={styles.pinkText}>{t.again}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
      <AppTabBar active={null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink.bg },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  title: { color: ink.text, fontSize: 28, fontWeight: '800' },
  hint: { color: ink.muted, fontSize: 13, lineHeight: 18 },
  end: { textAlign: 'right' },
  pink: { alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: ink.pink, alignItems: 'center', justifyContent: 'center' },
  pinkText: { color: ink.white, fontSize: 14, fontWeight: '800' },
  preview: { height: 360, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  frame: {
    position: 'absolute',
    top: 70,
    left: 48,
    right: 48,
    bottom: 90,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 16,
  },
  closeRow: { position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { backgroundColor: ink.card, borderRadius: 16, borderWidth: 1, borderColor: ink.line, padding: 14, gap: 10 },
  goodCard: { borderColor: '#1f6b45' },
  badCard: { borderColor: '#7a3038' },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  message: { color: ink.text, fontSize: 14, lineHeight: 20 },
  good: { color: '#8ee0b0' },
  bad: { color: '#ffb4b4' },
});
