export type NewsCategory =
  | 'All'
  | 'Academy News'
  | 'Competition'
  | 'Training'
  | 'Player Development'
  | 'Platform News';

export type NewsArticle = {
  id: string;
  category: Exclude<NewsCategory, 'All'>;
  date: string;
  image: string;
  featured?: boolean;
  title: string;
  excerpt: string;
  body: string[];
  titleAr: string;
  excerptAr: string;
  bodyAr: string[];
};

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

/** The same public stories the website shows on /news. */
export const NEWS: NewsArticle[] = [
  {
    id: 'season-open-2026',
    category: 'Academy News',
    date: '2026-09-18',
    image: photo('photo-1431324155629-1a6deb1dec8d'),
    featured: true,
    title: 'GolaX Hub opens the 2026 academy season',
    excerpt: 'Academies across the platform are now enrolling players for a season built around training, matches and public rankings.',
    body: [
      'The 2026 season opens with a clearer path for both academy players and free players. Academies keep their own squads, coaches and approvals, while every player still competes on the same platform rankings.',
      'Registration for academy players stays pending until that academy approves or rejects it. Free player requests go to the GolaX Hub platform for the same decision.',
      'Clubs already on GolaX Hub can publish age groups, player counts and contact details so families can compare academies before they apply.',
    ],
    titleAr: 'GolaX Hub يفتتح موسم الأكاديميات 2026',
    excerptAr: 'الأكاديميات على المنصة تسجّل اللاعبين الآن لموسم يقوم على التدريب والمباريات والترتيب العام.',
    bodyAr: [
      'يفتتح موسم 2026 مساراً أوضح للاعبي الأكاديميات واللاعبين الأحرار. تحتفظ كل أكاديمية بفرقها ومدربيها وموافقاتها، بينما يتنافس كل لاعب على ترتيب المنصة نفسه.',
      'يبقى تسجيل لاعب الأكاديمية معلقاً حتى توافق تلك الأكاديمية أو ترفضه. وتصل طلبات اللاعب الحر إلى منصة GolaX Hub للقرار نفسه.',
      'يمكن للأندية الموجودة على GolaX Hub نشر الفئات العمرية وأعداد اللاعبين وبيانات التواصل حتى تقارن العائلات بين الأكاديميات قبل التقديم.',
    ],
  },
  {
    id: 'regional-cup-draw',
    category: 'Competition',
    date: '2026-09-12',
    image: photo('photo-1508098682722-e99c43a406b2'),
    title: 'Regional cup draw sets the first match week',
    excerpt: 'Twelve teams learn their opening fixtures as the GolaX Hub Regional League publishes the season calendar.',
    body: [
      'The draw places academy teams and invited free-player squads into a single league table. Points from matches feed both team standings and individual player rankings.',
      'Match weeks run alongside regular training so coaches can connect session work to weekend performance.',
      'Full fixtures, results and player statistics will live in the competitions area as the season progresses.',
    ],
    titleAr: 'قرعة الكأس الإقليمية تحدد أسبوع المباريات الأول',
    excerptAr: 'اثنا عشر فريقاً يعرفون مواجهاتهم الافتتاحية مع نشر الدوري الإقليمي لـ GolaX Hub رزنامة الموسم.',
    bodyAr: [
      'تضع القرعة فرق الأكاديميات وفرق اللاعبين الأحرار المدعوة في جدول واحد. نقاط المباريات تغذّي ترتيب الفرق وترتيب اللاعبين الفردي.',
      'تجري أسابيع المباريات إلى جانب التدريب المعتاد حتى يربط المدربون عمل الحصة بأداء نهاية الأسبوع.',
      'ستظهر المباريات والنتائج وإحصاءات اللاعبين في قسم البطولات مع تقدم الموسم.',
    ],
  },
  {
    id: 'u14-performance',
    category: 'Training',
    date: '2026-09-04',
    image: photo('photo-1517927033932-b3d18e61fb3a'),
    title: 'New performance sessions for U14 players',
    excerpt: 'Speed, first touch and decision-making blocks are now part of the shared training calendar.',
    body: [
      'U14 groups will see a new block that mixes pitch work with simple performance notes. The aim is to make progress visible without turning the session into a spreadsheet.',
      'Academy coaches assign the work. Free players can follow the same block on the main platform and log completion for points.',
      'The sessions stay age-appropriate: short exposures, plenty of ball contact and a clear theme each week.',
    ],
    titleAr: 'حصص أداء جديدة للاعبي تحت 14',
    excerptAr: 'السرعة واللمسة الأولى واتخاذ القرار أصبحت جزءاً من رزنامة التدريب المشتركة.',
    bodyAr: [
      'سترى مجموعات تحت 14 وحدة جديدة تمزج عمل الملعب بملاحظات أداء بسيطة. الهدف أن يظهر التقدم دون أن تتحول الحصة إلى جدول أرقام.',
      'يوزّع مدربو الأكاديمية العمل. ويمكن للاعب الحر أن يتبع الوحدة نفسها على المنصة الرئيسية ويسجّل إكمالها للنقاط.',
      'تبقى الحصص مناسبة للعمر: فترات قصيرة، وتماس كثير مع الكرة، وموضوع واضح كل أسبوع.',
    ],
  },
  {
    id: 'rankings-explained',
    category: 'Player Development',
    date: '2026-08-28',
    image: photo('photo-1461896836934-ffe607ba6851'),
    title: 'How rankings and points work together',
    excerpt: 'Match minutes, training consistency and competition results now move a player up the public table.',
    body: [
      'Rankings are earned. Training attendance, completed sessions, match involvement and competition results each add points.',
      'Academy players and free players appear on the same table, with the academy name shown only when a player belongs to one.',
      'Rewards unlock from the points balance. They do not replace the ranking — they sit beside it.',
    ],
    titleAr: 'كيف يعمل الترتيب والنقاط معاً',
    excerptAr: 'دقائق المباريات وانتظام التدريب ونتائج البطولات ترفع اللاعب في الجدول العام.',
    bodyAr: [
      'الترتيب يُكتسب. حضور التدريب، والحصص المكتملة، والمشاركة في المباريات، ونتائج البطولات، كلها تضيف نقاطاً.',
      'يظهر لاعبو الأكاديميات واللاعبون الأحرار في الجدول نفسه، ويظهر اسم الأكاديمية فقط عندما ينتمي اللاعب إلى واحدة.',
      'تُفتح المكافآت من رصيد النقاط. لا تحل محل الترتيب، بل تقف إلى جواره.',
    ],
  },
  {
    id: 'free-player-pathway',
    category: 'Platform News',
    date: '2026-08-20',
    image: photo('photo-1579952363873-27f3bade9f55'),
    title: 'The free player pathway is open',
    excerpt: 'Players who are not in an academy can request a main-platform profile. The platform approves or rejects the request.',
    body: [
      'A free player account belongs to the main platform, not to an academy organization. There is no academy dropdown. The platform receives the request and can approve or reject it.',
      'Free players can still enter platform competitions, collect points and climb the rankings next to academy players.',
      'If a player later joins an academy, that move stays a separate decision. The first registration never forces an academy.',
    ],
    titleAr: 'مسار اللاعب الحر مفتوح',
    excerptAr: 'من ليس في أكاديمية يستطيع طلب ملف على المنصة الرئيسية. المنصة توافق على الطلب أو ترفضه.',
    bodyAr: [
      'حساب اللاعب الحر يتبع المنصة الرئيسية لا منظمة أكاديمية. لا توجد قائمة أكاديميات. تستلم المنصة الطلب ويمكنها الموافقة أو الرفض.',
      'ما زال اللاعب الحر يستطيع دخول بطولات المنصة وجمع النقاط والصعود في الترتيب إلى جانب لاعبي الأكاديميات.',
      'إذا انضم اللاعب لاحقاً إلى أكاديمية، يبقى ذلك قراراً مستقلاً. التسجيل الأول لا يفرض أكاديمية.',
    ],
  },
  {
    id: 'future-stars-ages',
    category: 'Academy News',
    date: '2026-08-02',
    image: photo('photo-1551958219-acbc608c6377'),
    title: 'Future Stars expands its age groups',
    excerpt: 'The Alexandria academy adds an older group and opens new places for the winter block.',
    body: [
      'Future Stars Academy is extending its pathway so players can stay in the same environment for longer.',
      'New places are reviewed by the academy. Applications sent from GolaX Hub arrive as pending until a coach or administrator approves them.',
      'Families can compare age groups, location and player numbers on the academies page before they apply.',
    ],
    titleAr: 'نجوم المستقبل توسّع فئاتها العمرية',
    excerptAr: 'أكاديمية الإسكندرية تضيف فئة أكبر وتفتح أماكن جديدة لفترة الشتاء.',
    bodyAr: [
      'تمد أكاديمية نجوم المستقبل مسارها حتى يبقى اللاعب في البيئة نفسها مدة أطول.',
      'تراجع الأكاديمية الأماكن الجديدة. الطلبات القادمة من GolaX Hub تصل معلّقة حتى يوافق عليها مدرب أو مسؤول.',
      'تستطيع العائلات مقارنة الفئات العمرية والموقع وأعداد اللاعبين في صفحة الأكاديميات قبل التقديم.',
    ],
  },
];

export const NEWS_CATEGORIES: NewsCategory[] = [
  'All',
  'Academy News',
  'Competition',
  'Training',
  'Player Development',
  'Platform News',
];

const CATEGORY_AR: Record<NewsCategory, string> = {
  All: 'الكل',
  'Academy News': 'أخبار الأكاديميات',
  Competition: 'البطولات',
  Training: 'التدريب',
  'Player Development': 'تطوير اللاعب',
  'Platform News': 'أخبار المنصة',
};

export function categoryLabel(category: NewsCategory, lang: 'en' | 'ar'): string {
  return lang === 'ar' ? CATEGORY_AR[category] : category;
}
