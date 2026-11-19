export type Lang = 'en' | 'ar';

export type Copy = {
  brand: string;
  splashTag: string;
  loginTab: string;
  signupTab: string;
  loginLead: string;
  userPh: string;
  passPh: string;
  forgot: string;
  signIn: string;
  termsLead: string;
  termsLink: string;
  missing: string;
  failed: string;
  resetTitle: string;
  resetLead: string;
  resetSend: string;
  resetBack: string;
  resetNeed: string;
  resetSent: string;
  showPassword: string;
  hidePassword: string;
  signupKicker: string;
  signupTitle: string;
  signupLead: string;
  steps: [string, string, string, string, string];
  typeQ: string;
  academy: string;
  academyHint: string;
  free: string;
  freeHint: string;
  freeClosed: string;
  continue: string;
  back: string;
  login: string;
  submit: string;
  submitting: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
  dob: string;
  gender: string;
  male: string;
  female: string;
  phone: string;
  country: string;
  city: string;
  position: string;
  academyTitle: string;
  academyHintLong: string;
  academySearch: string;
  academyEmpty: string;
  academyLoading: string;
  teamTitle: string;
  teamHint: string;
  season: string;
  team: string;
  noSeasons: string;
  noTeams: string;
  captain: string;
  playerN: string;
  reviewType: string;
  reviewName: string;
  reviewContact: string;
  reviewLocation: string;
  reviewPosition: string;
  reviewAcademy: string;
  reviewStatus: string;
  reviewTeam: string;
  pendingAcademy: string;
  pendingPlatform: string;
  submitted: string;
  sentAcademy: string;
  sentPlatform: string;
  backToLogin: string;
  editProfile: string;
  editFootball: string;
  editAcademy: string;
  required: string;
  badUsername: string;
  badEmail: string;
  badPassword: string;
  badMatch: string;
  badDob: string;
  badPhone: string;
  needAcademy: string;
  needSeason: string;
  needTeam: string;
  needMates: string;
  freeNote: string;
};

export const copy: Record<Lang, Copy> = {
  en: {
    brand: 'GolaX Hub',
    splashTag: 'The football platform',
    loginTab: 'Sign in',
    signupTab: 'Create account',
    loginLead: 'Use your username or email and password.',
    userPh: 'Username or email',
    passPh: 'Password',
    forgot: 'Forgot password?',
    signIn: 'Sign in',
    termsLead: 'By continuing, you agree to the ',
    termsLink: 'Terms and Conditions',
    missing: 'Enter your username or email and your password.',
    failed: 'Sign in failed.',
    resetTitle: 'Reset password',
    resetLead: 'Enter the username or email for the account.',
    resetSend: 'Send reset link',
    resetBack: 'Back to sign in',
    resetNeed: 'Enter the username or email for the account.',
    resetSent: 'If this account exists, reset instructions will be sent to the registered email.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    signupKicker: 'Sign up',
    signupTitle: 'Create your football profile',
    signupLead: 'Choose how you want to join the platform.',
    steps: ['Path', 'Profile', 'Football', 'Academy', 'Review'],
    typeQ: 'What type of player are you?',
    academy: 'Academy player',
    academyHint: 'Join a football academy and become part of an organized football environment.',
    free: 'Free player',
    freeHint: 'Create your player profile and participate in the main platform without joining a specific academy.',
    freeClosed: 'Opens when season registration is open.',
    continue: 'Continue',
    back: 'Back',
    login: 'Login',
    submit: 'Submit registration',
    submitting: 'Submitting…',
    firstName: 'First name',
    lastName: 'Last name',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    confirm: 'Confirm password',
    dob: 'Date of birth',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    phone: 'Phone number',
    country: 'Country',
    city: 'City',
    position: 'Preferred position',
    academyTitle: 'Select your academy',
    academyHintLong: 'Only one active academy. Your registration is sent to that academy for approval.',
    academySearch: 'Search academies',
    academyEmpty: 'No active academies match your search.',
    academyLoading: 'Loading academies…',
    teamTitle: 'Your team',
    teamHint: 'Pick a season and a team. You are the captain. Fill every remaining slot.',
    season: 'Season',
    team: 'Team name',
    noSeasons: 'No season is open for registration yet.',
    noTeams: 'This season does not have team names yet.',
    captain: 'Captain',
    playerN: 'Player',
    reviewType: 'Player type',
    reviewName: 'Name',
    reviewContact: 'Contact',
    reviewLocation: 'Location',
    reviewPosition: 'Position',
    reviewAcademy: 'Academy',
    reviewStatus: 'Status after submit',
    reviewTeam: 'Team',
    pendingAcademy: 'Pending academy approval',
    pendingPlatform: 'Pending platform approval',
    submitted: 'Registration submitted',
    sentAcademy: 'Your registration has been sent to the selected academy. You can sign in after they approve it.',
    sentPlatform: 'Your registration has been sent to GolaX Hub. You can sign in after the platform approves it.',
    backToLogin: 'Back to login',
    editProfile: 'Edit profile',
    editFootball: 'Edit football',
    editAcademy: 'Edit academy',
    required: 'This field is required.',
    badUsername: 'Use 3–24 letters, numbers, dots or underscores.',
    badEmail: 'Enter a valid email.',
    badPassword: 'Use at least 8 characters.',
    badMatch: 'Passwords do not match.',
    badDob: 'Use a past date as YYYY-MM-DD.',
    badPhone: 'Enter a valid phone number.',
    needAcademy: 'Select one academy.',
    needSeason: 'Select a season.',
    needTeam: 'Select a team name.',
    needMates: 'Fill every teammate on this squad.',
    freeNote: 'This team request is sent so the platform can approve or reject it.',
  },
  ar: {
    brand: 'GolaX Hub',
    splashTag: 'منصة كرة القدم',
    loginTab: 'تسجيل الدخول',
    signupTab: 'إنشاء حساب',
    loginLead: 'استخدم اسم المستخدم أو البريد الإلكتروني وكلمة المرور.',
    userPh: 'اسم المستخدم أو البريد الإلكتروني',
    passPh: 'كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    signIn: 'تسجيل الدخول',
    termsLead: 'بالمتابعة، أنت توافق على ',
    termsLink: 'الشروط والأحكام',
    missing: 'أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور.',
    failed: 'تعذر تسجيل الدخول.',
    resetTitle: 'استعادة كلمة المرور',
    resetLead: 'أدخل اسم المستخدم أو البريد الإلكتروني للحساب.',
    resetSend: 'إرسال رابط الاستعادة',
    resetBack: 'العودة لتسجيل الدخول',
    resetNeed: 'أدخل اسم المستخدم أو البريد الإلكتروني للحساب.',
    resetSent: 'إذا كان الحساب موجوداً، ستصلك تعليمات الاستعادة على البريد المسجل.',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    signupKicker: 'إنشاء حساب',
    signupTitle: 'أنشئ ملفك الكروي',
    signupLead: 'اختر كيف تريد الانضمام إلى المنصة.',
    steps: ['المسار', 'الملف', 'كرة القدم', 'الأكاديمية', 'المراجعة'],
    typeQ: 'ما نوع اللاعب الذي تمثله؟',
    academy: 'لاعب أكاديمية',
    academyHint: 'انضم إلى أكاديمية كرة قدم وكن جزءاً من بيئة كروية منظمة.',
    free: 'لاعب حر',
    freeHint: 'أنشئ ملفك وشارك في المنصة الرئيسية دون الانضمام إلى أكاديمية محددة.',
    freeClosed: 'يفتح عند فتح تسجيل الموسم.',
    continue: 'متابعة',
    back: 'رجوع',
    login: 'تسجيل الدخول',
    submit: 'إرسال التسجيل',
    submitting: 'جارٍ الإرسال…',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    username: 'اسم المستخدم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirm: 'تأكيد كلمة المرور',
    dob: 'تاريخ الميلاد',
    gender: 'النوع',
    male: 'ذكر',
    female: 'أنثى',
    phone: 'رقم الهاتف',
    country: 'الدولة',
    city: 'المدينة',
    position: 'المركز المفضل',
    academyTitle: 'اختر أكاديميتك',
    academyHintLong: 'أكاديمية واحدة فقط. يُرسل تسجيلك إلى تلك الأكاديمية للموافقة.',
    academySearch: 'ابحث عن أكاديمية',
    academyEmpty: 'لا توجد أكاديمية نشطة مطابقة.',
    academyLoading: 'جارٍ تحميل الأكاديميات…',
    teamTitle: 'فريقك',
    teamHint: 'اختر الموسم والفريق. أنت القائد. أكمل بقية المراكز.',
    season: 'الموسم',
    team: 'اسم الفريق',
    noSeasons: 'لا يوجد موسم مفتوح للتسجيل حالياً.',
    noTeams: 'لم تُضف أسماء فرق لهذا الموسم بعد.',
    captain: 'القائد',
    playerN: 'لاعب',
    reviewType: 'نوع اللاعب',
    reviewName: 'الاسم',
    reviewContact: 'التواصل',
    reviewLocation: 'الموقع',
    reviewPosition: 'المركز',
    reviewAcademy: 'الأكاديمية',
    reviewStatus: 'الحالة بعد الإرسال',
    reviewTeam: 'الفريق',
    pendingAcademy: 'بانتظار موافقة الأكاديمية',
    pendingPlatform: 'بانتظار موافقة المنصة',
    submitted: 'تم إرسال التسجيل',
    sentAcademy: 'أُرسل تسجيلك إلى الأكاديمية المختارة. يمكنك الدخول بعد الموافقة.',
    sentPlatform: 'أُرسل تسجيلك إلى جولا إكس هب. يمكنك الدخول بعد موافقة المنصة.',
    backToLogin: 'العودة لتسجيل الدخول',
    editProfile: 'تعديل الملف',
    editFootball: 'تعديل كرة القدم',
    editAcademy: 'تعديل الأكاديمية',
    required: 'هذا الحقل مطلوب.',
    badUsername: 'استخدم من 3 إلى 24 حرفاً أو رقماً أو نقطة أو شرطة سفلية.',
    badEmail: 'أدخل بريداً إلكترونياً صحيحاً.',
    badPassword: 'استخدم 8 أحرف على الأقل.',
    badMatch: 'كلمتا المرور غير متطابقتين.',
    badDob: 'أدخل تاريخاً سابقاً بالشكل YYYY-MM-DD.',
    badPhone: 'أدخل رقم هاتف صحيحاً.',
    needAcademy: 'اختر أكاديمية واحدة.',
    needSeason: 'اختر الموسم.',
    needTeam: 'اختر اسم الفريق.',
    needMates: 'أكمل بيانات كل لاعب في الفريق.',
    freeNote: 'يُرسل طلب الفريق إلى المنصة للموافقة أو الرفض.',
  },
};
