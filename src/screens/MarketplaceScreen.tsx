import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mediaUrl } from '@/api/platform';
import {
  loadMarketplace,
  playerWallet,
  purchaseReward,
  storeHistory,
  type ShopCard,
  type ShopKind,
  type StoreHistoryRow,
} from '@/api/marketplace';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { AppTabBar } from '@/components/AppTabBar';
import { ScreenBack } from '@/components/ScreenBack';
import { sharedPicture } from '@/shared/media';
import { useLocale } from '@/i18n/LocaleContext';

type Filter = 'all' | ShopKind;

const HERO = 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1600&q=80';

export function MarketplaceScreen() {
  const { lang, rtl } = useLocale();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const align = rtl ? 'right' : 'left';
  const player = profile?.role === 'PLAYER';
  const columns = width >= 700 ? 2 : 1;
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<Filter>('all');
  const [rows, setRows] = useState<ShopCard[]>([]);
  const [picked, setPicked] = useState<ShopCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [points, setPoints] = useState<number | null>(null);
  const [deemed, setDeemed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<StoreHistoryRow[]>([]);
  const [buying, setBuying] = useState(false);

  const labels = lang === 'ar'
    ? {
        kicker: 'المتجر',
        title: 'تجهيز. عيادات. مكافآت.',
        lead: 'منتجات وخدمات للاعبين. كل بطاقة تعرض السعر والنقاط والخصم.',
        search: 'ابحث عن منتجات وعروض وعيادات',
        searchBtn: 'بحث',
        all: 'الكل',
        product: 'منتجات',
        service: 'خدمات',
        empty: 'لا يوجد شيء في هذا التبويب بعد.',
        found: 'تم العثور على',
        points: 'النقاط',
        price: 'السعر',
        discount: 'خصم',
        stock: 'المخزون',
        inStock: 'متوفر',
        out: 'غير متوفر',
        unlimited: 'غير محدود',
        history: 'سجل المتجر',
        close: 'إغلاق',
        purchase: 'شراء',
        buy: 'شراء مقابل',
        pts: 'نقطة',
        players: 'حساب اللاعب فقط يستطيع الشراء بالنقاط.',
        deemed: 'النقاط معلقة ولا يمكن إنفاقها الآن.',
        none: 'لا توجد عمليات شراء بعد.',
        spendable: 'نقاط قابلة للإنفاق',
      }
    : {
        kicker: 'Marketplace',
        title: 'Gear. Clinics. Rewards.',
        lead: 'Products and services for players. Every card shows the price, the points, and the discount.',
        search: 'Search products, deals and clinics',
        searchBtn: 'Search',
        all: 'All',
        product: 'Products',
        service: 'Services',
        empty: 'Nothing to show in this tab yet.',
        found: 'found',
        points: 'Points',
        price: 'Price',
        discount: 'Discount',
        stock: 'Stock',
        inStock: 'In stock',
        out: 'Out of stock',
        unlimited: 'Unlimited',
        history: 'Store history',
        close: 'Close',
        purchase: 'Purchase',
        buy: 'Purchase for',
        pts: 'pts',
        players: 'A player account can purchase with points.',
        deemed: 'Points are held and cannot be spent right now.',
        none: 'No purchases yet.',
        spendable: 'Spendable points',
      };

  const reload = useCallback(async (needle: string) => {
    const [next, wallet] = await Promise.all([
      loadMarketplace(needle, lang === 'ar'),
      player ? playerWallet() : Promise.resolve(null),
    ]);
    setRows(next);
    setPlayerId(wallet?.playerId ?? '');
    setPoints(wallet?.wallet.available ?? null);
    setDeemed(wallet?.wallet.deemed ?? false);
  }, [lang, player]);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    const handle = setTimeout(() => {
      reload(query)
        .catch((reason: unknown) => {
          if (!active) return;
          setRows([]);
          setError(reason instanceof ApiError ? reason.message : 'The store could not be loaded.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, reload]));

  const visible = rows.filter((item) => kind === 'all' || item.kind === kind);

  async function refresh() {
    setRefreshing(true);
    setError('');
    try {
      await reload(query);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'The store could not be loaded.');
    } finally {
      setRefreshing(false);
    }
  }

  async function openHistory() {
    setHistoryOpen(true);
    if (!playerId) {
      setHistory([]);
      return;
    }
    try {
      setHistory(await storeHistory(playerId));
    } catch {
      setHistory([]);
    }
  }

  async function buy(card: ShopCard) {
    if (!card.rewardId || !playerId || deemed || !card.inStock) return;
    setBuying(true);
    setError('');
    setInfo('');
    try {
      await purchaseReward(card.rewardId, playerId);
      setInfo(`${card.name} purchased.`);
      setPicked(null);
      await reload(query);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'The purchase did not go through.');
    } finally {
      setBuying(false);
    }
  }

  function rewardName(rewardId: string): string {
    return rows.find((item) => item.rewardId === rewardId)?.name || labels.purchase;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.page}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor="#d4af37" />}
        >
          <ScreenBack />
          {error ? <Text style={styles.banner}>{error}</Text> : null}
          {info ? <Text style={styles.notice}>{info}</Text> : null}

          <View style={styles.hero}>
            <Text style={[styles.kicker, { textAlign: align }]}>{labels.kicker}</Text>
            <Text style={[styles.title, { textAlign: align }]}>{labels.title}</Text>
            <Text style={[styles.lead, { textAlign: align }]}>{labels.lead}</Text>
            <View style={[styles.meta, rtl && styles.rtl]}>
              <View style={styles.balance}>
                <View style={styles.coin} />
                <Text style={styles.balanceValue}>{formatPoints(points ?? 0, lang)}</Text>
                <Text style={styles.balanceLabel}>{deemed ? labels.spendable : labels.points}</Text>
              </View>
              <Pressable style={styles.lineBtn} onPress={() => void openHistory()}>
                <Text style={styles.lineBtnText}>{labels.history}</Text>
              </Pressable>
            </View>
            {deemed ? <Text style={[styles.muted, { textAlign: align }]}>{labels.deemed}</Text> : null}
            <View style={[styles.filters, rtl && styles.rtl]}>
              {(['all', 'product', 'service'] as const).map((item) => {
                const on = item === kind;
                return (
                  <Pressable key={item} style={[styles.chip, on && styles.chipOn]} onPress={() => setKind(item)}>
                    <Text style={styles.chipText}>{labels[item]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.searchRow, rtl && styles.rtl]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={labels.search}
                placeholderTextColor="#8d998f"
                style={[styles.search, { textAlign: align }]}
              />
            </View>
            <Image source={{ uri: HERO }} style={styles.visual} />
          </View>

          {query.trim() ? (
            <Text style={[styles.result, { textAlign: align }]}>{visible.length} {labels.found}</Text>
          ) : null}
          {loading ? <ActivityIndicator color="#19a967" /> : null}
          {!loading && !visible.length ? <Text style={[styles.muted, { textAlign: align }]}>{labels.empty}</Text> : null}

          <View style={styles.grid}>
            {visible.map((item) => (
              <Pressable key={item.id} style={[styles.offer, { width: columns === 2 ? '48%' : '100%' }]} onPress={() => setPicked(item)}>
                <View style={styles.media}>
                  {picture(item.image) ? <Image source={picture(item.image)!} style={styles.photo} resizeMode="contain" /> : <View style={styles.photo} />}
                  {item.discount ? <Text style={styles.badge}>-{item.discount}%</Text> : null}
                  {item.rewardId && !item.inStock ? <Text style={styles.stockBadge}>{labels.out}</Text> : null}
                </View>
                <View style={styles.body}>
                  <Text style={[styles.kicker, { textAlign: align }]}>{item.kind === 'product' ? labels.product : labels.service}</Text>
                  <Text style={[styles.offerTitle, { textAlign: align }]}>{item.name}</Text>
                  <Text style={[styles.summary, { textAlign: align }]} numberOfLines={2}>{item.summary}</Text>
                  <View style={[styles.priceRow, rtl && styles.rtl]}>
                    <Text style={styles.price}>{money(saleOf(item), item.currency, lang)}</Text>
                    {item.discount && item.price != null ? <Text style={styles.compare}>{money(item.price, item.currency, lang)}</Text> : null}
                    <Text style={styles.priceLabel}>{labels.price}</Text>
                  </View>
                  <View style={[styles.priceRow, rtl && styles.rtl]}>
                    <View style={styles.coin} />
                    <Text style={styles.points}>{formatPoints(item.points, lang)}</Text>
                    <Text style={styles.priceLabel}>{labels.points}</Text>
                  </View>
                  {item.discount ? <Text style={styles.pill}>{item.discount}% {labels.discount}</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <AppTabBar active="marketplace" />
      </SafeAreaView>

      <Modal visible={!!picked} transparent animationType="fade" onRequestClose={() => setPicked(null)}>
        {picked ? (
          <Pressable style={styles.sheetBack} onPress={() => setPicked(null)}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <View style={styles.sheetMedia}>
                {picture(picked.image) ? <Image source={picture(picked.image)!} style={styles.sheetPhoto} resizeMode="contain" /> : <View style={styles.sheetPhoto} />}
                <Pressable style={styles.close} onPress={() => setPicked(null)}>
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
                {picked.discount ? <Text style={styles.badge}>-{picked.discount}%</Text> : null}
              </View>
              <ScrollView contentContainerStyle={styles.sheetBody}>
                <Text style={[styles.kicker, { textAlign: align }]}>{picked.kind === 'product' ? labels.product : labels.service}</Text>
                <Text style={[styles.sheetTitle, { textAlign: align }]}>{picked.name}</Text>
                <Text style={[styles.summary, { textAlign: align }]}>{picked.details || picked.summary}</Text>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>{labels.price}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{money(saleOf(picked), picked.currency, lang)}</Text>
                    {picked.discount && picked.price != null ? <Text style={styles.compare}>{money(picked.price, picked.currency, lang)}</Text> : null}
                  </View>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>{labels.points}</Text>
                  <View style={styles.priceRow}>
                    <View style={styles.coin} />
                    <Text style={styles.points}>{formatPoints(picked.points, lang)}</Text>
                  </View>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>{labels.discount}</Text>
                  <Text style={styles.factValue}>{picked.discount ? `${picked.discount}%` : '—'}</Text>
                </View>
                {picked.rewardId ? (
                  <View style={styles.fact}>
                    <Text style={styles.factLabel}>{labels.stock}</Text>
                    <Text style={styles.factValue}>{stockText(picked, labels)}</Text>
                  </View>
                ) : null}
                {picked.rewardId ? (
                  <Pressable
                    style={[styles.buy, (!picked.inStock || deemed || !player || buying) && styles.buyOff]}
                    disabled={!picked.inStock || deemed || !player || buying}
                    onPress={() => void buy(picked)}
                  >
                    <Text style={styles.buyText}>
                      {deemed ? labels.deemed : picked.inStock ? `${labels.buy} ${formatPoints(picked.points, lang)} ${labels.pts}` : labels.out}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.buy, styles.buyOff]} disabled>
                    <Text style={styles.buyText}>{labels.purchase}</Text>
                  </Pressable>
                )}
                {!player ? <Text style={styles.centerNote}>{labels.players}</Text> : null}
              </ScrollView>
            </Pressable>
          </Pressable>
        ) : null}
      </Modal>

      <Modal visible={historyOpen} transparent animationType="fade" onRequestClose={() => setHistoryOpen(false)}>
        <Pressable style={styles.sheetBack} onPress={() => setHistoryOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.historyHead}>
              <Text style={styles.sheetTitle}>{labels.history}</Text>
              <Pressable style={styles.lineBtn} onPress={() => setHistoryOpen(false)}>
                <Text style={styles.lineBtnText}>{labels.close}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetBody}>
              {!player ? <Text style={styles.summary}>{labels.players}</Text> : null}
              {player && !history.length ? <Text style={styles.summary}>{labels.none}</Text> : null}
              {history.map((row) => (
                <View key={row.id} style={styles.historyRow}>
                  <Text style={styles.offerTitle}>{rewardName(row.rewardId)}</Text>
                  <Text style={styles.points}>{formatPoints(row.pointCost, lang)}</Text>
                  <Text style={styles.priceLabel}>{row.status}</Text>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function picture(url: string | null): ImageSourcePropType | null {
  const local = sharedPicture(url);
  if (local) return local;
  if (url && /^(https?:|data:)/i.test(url)) return { uri: url };
  const remote = mediaUrl(url);
  return remote && /^(https?:|data:)/i.test(remote) ? { uri: remote } : null;
}

function saleOf(item: ShopCard): number | null {
  if (item.price == null) return null;
  if (!item.discount) return item.price;
  return Math.round(item.price * (100 - item.discount)) / 100;
}

function money(amount: number | null, currency: string, lang: string): string {
  if (amount == null) return '—';
  const code = currency.length === 3 ? currency : 'EGP';
  try {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

function formatPoints(value: number | null, lang: string): string {
  if (value == null) return '—';
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-EG').format(value);
}

function stockText(item: ShopCard, labels: { out: string; unlimited: string; inStock: string }): string {
  if (!item.inStock) return labels.out;
  if (item.stockQuantity == null) return labels.unlimited;
  return String(item.stockQuantity);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0d0c' },
  flex: { flex: 1 },
  page: { padding: 16, gap: 14, paddingBottom: 28 },
  banner: { color: '#ffd0d0', backgroundColor: '#3a1d1d', borderRadius: 12, padding: 12, overflow: 'hidden' },
  notice: { color: '#d8f6c8', backgroundColor: '#14392c', borderRadius: 12, padding: 12, overflow: 'hidden' },
  hero: { gap: 10 },
  kicker: { color: '#d4af37', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 40, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', lineHeight: 42 },
  lead: { color: '#b7c2bb', fontSize: 15, lineHeight: 22 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 6 },
  rtl: { flexDirection: 'row-reverse' },
  balance: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coin: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#d4af37', borderWidth: 2, borderColor: '#ffe7a3' },
  balanceValue: { color: '#d4af37', fontWeight: '800', fontSize: 16 },
  balanceLabel: { color: '#d4af37', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  lineBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  lineBtnText: { color: '#ffffff', fontWeight: '700' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 14, paddingVertical: 7 },
  chipOn: { borderColor: '#19a967', backgroundColor: 'rgba(25,169,103,0.16)' },
  chipText: { color: '#ffffff', fontWeight: '700' },
  searchRow: { marginTop: 4 },
  search: { backgroundColor: '#151918', color: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 12 },
  visual: { height: 170, borderRadius: 20, backgroundColor: '#151918', marginTop: 6 },
  result: { color: '#d4af37', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  muted: { color: '#b7c2bb', lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  offer: { backgroundColor: '#151918', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  media: { height: 180, backgroundColor: '#101412' },
  photo: { width: '100%', height: '100%', backgroundColor: '#101412' },
  badge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#19a967', color: '#04140c', fontWeight: '800', fontSize: 11, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3 },
  stockBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#3a1d1d', color: '#ffd0d0', fontWeight: '800', fontSize: 11, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3 },
  body: { padding: 14, gap: 6 },
  offerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  summary: { color: '#b7c2bb', fontSize: 14, lineHeight: 20, minHeight: 40 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  compare: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecorationLine: 'line-through' },
  priceLabel: { color: '#d4af37', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  points: { color: '#d4af37', fontSize: 22, fontWeight: '700' },
  pill: { alignSelf: 'flex-start', color: '#04140c', backgroundColor: '#d4af37', fontWeight: '800', fontSize: 11, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3 },
  sheetBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: 18 },
  sheet: { maxHeight: '92%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#121615', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sheetMedia: { height: 220, backgroundColor: '#101412' },
  sheetPhoto: { width: '100%', height: '100%' },
  close: { position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(11,13,12,0.72)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#ffffff', fontSize: 18, lineHeight: 20 },
  sheetBody: { padding: 18, gap: 10 },
  sheetTitle: { color: '#ffffff', fontSize: 28, fontWeight: '700', textTransform: 'uppercase' },
  fact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  factLabel: { color: '#d4af37', fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  factValue: { color: '#ffffff', fontWeight: '700' },
  buy: { backgroundColor: '#19a967', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buyOff: { opacity: 0.45 },
  buyText: { color: '#04140c', fontWeight: '800' },
  centerNote: { color: '#b7c2bb', textAlign: 'center', fontSize: 12 },
  historyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingBottom: 0 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
});
