import { Redirect, useLocalSearchParams } from 'expo-router';
import { AttendanceScreen } from '@/screens/AttendanceScreen';
import { FinanceScreen, type FinanceSection } from '@/screens/FinanceScreen';
import { GlobalAgentScreen } from '@/screens/GlobalAgentScreen';
import { GroupsScreen } from '@/screens/GroupsScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { MarketplaceScreen } from '@/screens/MarketplaceScreen';
import { MethodologiesScreen } from '@/screens/MethodologiesScreen';
import { PaymentMethodsScreen } from '@/screens/PaymentMethodsScreen';
import { PlayersScreen } from '@/screens/PlayersScreen';
import { ScanAttendanceScreen } from '@/screens/ScanAttendanceScreen';
import { StaffAttendanceScreen } from '@/screens/StaffAttendanceScreen';
import { TrainingScreen } from '@/screens/TrainingScreen';
import { UsersScreen } from '@/screens/UsersScreen';
import { WebScreen } from '@/screens/WebScreen';

export default function ScreenRoute() {
  const { slug } = useLocalSearchParams<{ slug: string | string[] }>();
  const path = Array.isArray(slug) ? slug.join('/') : slug || 'dashboard';
  if (path === 'profile') return <Redirect href="/profile" />;
  if (path === 'marketplace') return <MarketplaceScreen />;
  if (path === 'users') return <UsersScreen />;
  if (path === 'payment-methods') return <PaymentMethodsScreen />;
  if (path === 'players') return <PlayersScreen />;
  if (path === 'training' || path === 'my-training') return <TrainingScreen />;
  if (path === 'training/methodologies') return <MethodologiesScreen />;
  if (path === 'leaderboard') return <LeaderboardScreen />;
  if (path === 'ai-global') return <GlobalAgentScreen />;
  if (path === 'groups') return <GroupsScreen />;
  if (path === 'attendance') return <AttendanceScreen />;
  if (path === 'scan-attendance') return <ScanAttendanceScreen />;
  if (path === 'staff-attendance') return <StaffAttendanceScreen />;
  if (path.startsWith('finance/')) {
    const section = path.slice('finance/'.length) as FinanceSection;
    if (section === 'income' || section === 'expenses' || section === 'subscriptions' || section === 'profit' || section === 'share-capital') {
      return <FinanceScreen section={section} />;
    }
  }
  return <WebScreen path={path} />;
}
