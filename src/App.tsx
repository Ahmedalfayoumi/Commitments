/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Plus,
  ChevronDown,
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  User,
  Lock,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  Info,
  ClipboardList,
  MapPin,
  UserCheck,
  Image as ImageIcon,
  Settings,
  Save,
  CreditCard,
  History,
  Wallet,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (amount: number, currencyCode: string = 'SAR', symbol?: string) => {
  const code = currencyCode || 'SAR';
  if (symbol) {
    return `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  }
  try {
    return new Intl.NumberFormat('ar-SA', { 
      style: 'currency', 
      currency: code,
      currencyDisplay: 'symbol'
    }).format(amount);
  } catch (e) {
    return `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`;
  }
};

// --- Types ---

interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  company_id: number | null;
}

interface Company {
  id: number;
  name_en: string;
  name_ar: string;
  company_type: string;
  sectors: string;
  country: string;
  city: string;
  street?: string;
  building_name?: string;
  building_number?: string;
  floor?: string;
  office_number?: string;
  phone?: string;
  signatory_name?: string;
  signatory_phone?: string;
  logo?: string;
  favicon?: string;
  currency_code: string;
  currency_symbol?: string;
  created_at: string;
}

interface Currency {
  code: string;
  name_ar: string;
  name_en: string;
  symbol: string;
}

interface Commitment {
  id: number;
  commit_number: string;
  due_date: string;
  account: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
}

type SortField = 'due_date' | 'created_at' | 'amount' | 'description' | 'status';
type SortOrder = 'ASC' | 'DESC';

// --- Auth Context ---

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });
  const [company, setCompany] = useState<Company | null>(null);

  const fetchCompany = async (companyId: number) => {
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
      }
    } catch (err) {
      console.error('Failed to fetch company:', err);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchCompany(user.company_id);
    }
  }, [user]);

  const refreshCompany = async () => {
    if (user?.company_id) {
      await fetchCompany(user.company_id);
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, company, token, login, logout, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// --- Components ---

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-900/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">تسجيل الدخول</h1>
          <p className="text-slate-500">مرحباً بك مجدداً في نظام الالتزامات</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 mr-1">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                placeholder="أدخل اسم المستخدم"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 mr-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                placeholder="أدخل كلمة المرور"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري التحميل...' : 'دخول'}
          </button>

          <div className="text-center pt-4">
            <p className="text-slate-500 text-sm">
              ليس لديك حساب؟{' '}
              <button 
                type="button" 
                onClick={onSwitch}
                className="text-slate-900 font-bold hover:underline"
              >
                سجل شركتك الآن
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/currencies');
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    }
  };

  const sectorsList = [
    'تجاري', 'خدمي', 'صناعي', 'صحي', 'فندقي', 'عقارات', 'اتصالات', 'تكنولوجيا المعلومات',
    'التعدين', 'التعليم', 'زراعة', 'سياحة', 'الصناعات الدوائية والطبية', 'الصناعات الغذائية',
    'البترول والغاز', 'الغزل والنسيج'
  ];

  const handleSectorChange = (sector: string) => {
    setSelectedSectors(prev => 
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    // Add sectors as a comma-separated string
    if (selectedSectors.length === 0) {
      setError('يرجى اختيار قطاع واحد على الأقل');
      setLoading(false);
      return;
    }
    payload.sectors = selectedSectors.join(', ');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => onSwitch(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 text-center"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">تم التسجيل بنجاح!</h2>
          <p className="text-slate-500">جاري تحويلك لصفحة تسجيل الدخول...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-4 sm:p-8" dir="rtl">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">تسجيل الشركة</h1>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onSwitch}
              className="px-6 py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-[#4F46E5] text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#4338CA] transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>

        <div className="p-8 space-y-12">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Dashboard Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#4F46E5] border-b border-slate-100 pb-4">
              <Info className="w-5 h-5" />
              <h2 className="text-lg font-bold">لوحة التحكم</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">اسم الشركة (بالإنجليزي)</label>
                <input 
                  name="name_en" 
                  required 
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all text-left" 
                  dir="ltr"
                  placeholder="Your Company Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 block">اسم الشركة (بالعربي)</label>
                <input 
                  name="name_ar" 
                  required 
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" 
                  placeholder="اسم شركتك"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">العملة الافتراضية</label>
                <select 
                  name="currency_code" 
                  defaultValue="SAR"
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.name_ar} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Registration Details Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#4F46E5] border-b border-slate-100 pb-4">
              <ClipboardList className="w-5 h-5" />
              <h2 className="text-lg font-bold">تفاصيل التسجيل</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">نوع الشركة</label>
                <select 
                  name="company_type" 
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all appearance-none"
                >
                  <option value="">اختر نوع الشركة</option>
                  <option value="مؤسسة فردية">مؤسسة فردية</option>
                  <option value="شركة تضامن">شركة تضامن</option>
                  <option value="شركة توصية بسيطة">شركة توصية بسيطة</option>
                  <option value="شركة ذات مسؤولية محدودة">شركة ذات مسؤولية محدودة</option>
                  <option value="أجنبية فرع عامل">أجنبية فرع عامل</option>
                  <option value="أجنبية فرع غير عامل">أجنبية فرع غير عامل</option>
                  <option value="معفاة">معفاة</option>
                  <option value="شركة غير ربحية">شركة غير ربحية</option>
                  <option value="شركة مناطق حرة">شركة مناطق حرة</option>
                  <option value="شركة استثمار مشترك">شركة استثمار مشترك</option>
                  <option value="شركة مدنية">شركة مدنية</option>
                  <option value="شركة توصية بالأسهم">شركة توصية بالأسهم</option>
                  <option value="مساهمة عامة محدودة">مساهمة عامة محدودة</option>
                  <option value="مساهمة خاصة محدودة">مساهمة خاصة محدودة</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-500">قطاعات الشركة</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sectorsList.map(sector => (
                    <label key={sector} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedSectors.includes(sector)}
                          onChange={() => handleSectorChange(sector)}
                          className="peer appearance-none w-5 h-5 border border-slate-300 rounded bg-white checked:bg-[#4F46E5] checked:border-[#4F46E5] transition-all"
                        />
                        <CheckCircle2 className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{sector}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Address Details Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#4F46E5] border-b border-slate-100 pb-4">
              <MapPin className="w-5 h-5" />
              <h2 className="text-lg font-bold">تفاصيل العنوان</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">الدولة</label>
                <select name="country" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all">
                  <option value="الأردن">الأردن</option>
                  <option value="المملكة العربية السعودية">المملكة العربية السعودية</option>
                  <option value="الإمارات العربية المتحدة">الإمارات العربية المتحدة</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">المدينة</label>
                <input name="city" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">الشارع</label>
                <input name="street" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">اسم المبنى</label>
                <input name="building_name" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">رقم المبنى</label>
                <input name="building_number" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">الطابق</label>
                <input name="floor" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">رقم المكتب/المحل</label>
                <input name="office_number" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-500">رقم الهاتف</label>
                <input name="phone" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all text-left" dir="ltr" placeholder="+962 00 000 0000" />
              </div>
            </div>
          </section>

          {/* Authorized Signatory Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#4F46E5] border-b border-slate-100 pb-4">
              <UserCheck className="w-5 h-5" />
              <h2 className="text-lg font-bold">المفوض بالتوقيع</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">اسم المفوض</label>
                <input name="signatory_name" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">هاتف المفوض</label>
                <input name="signatory_phone" className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all text-left" dir="ltr" />
              </div>
            </div>
          </section>

          {/* Branding Section */}
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4 text-center">
                <label className="text-sm font-medium text-slate-500">شعار الشركة</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[#4F46E5] transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-[#4F46E5]/5 transition-colors">
                    <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-[#4F46E5]" />
                  </div>
                  <input type="hidden" name="logo" value="" />
                  <span className="text-[#4F46E5] text-sm font-medium">تحميل الصورة</span>
                </div>
              </div>
              <div className="space-y-4 text-center">
                <label className="text-sm font-medium text-slate-500">أيقونة الموقع</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[#4F46E5] transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-[#4F46E5]/5 transition-colors">
                    <Settings className="w-6 h-6 text-slate-300 group-hover:text-[#4F46E5]" />
                  </div>
                  <input type="hidden" name="favicon" value="" />
                  <span className="text-[#4F46E5] text-sm font-medium">تحميل الصورة</span>
                </div>
              </div>
            </div>
          </section>

          {/* System Admin Data (Required for registration) */}
          <section className="space-y-6 bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-200 pb-4">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-lg font-bold">بيانات مدير النظام</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">اسم مستخدم المدير</label>
                <input name="username" required className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">كلمة مرور المدير</label>
                <input name="password" type="password" required className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all" />
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
          <button 
            type="button" 
            onClick={onSwitch}
            className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900"
          >
            العودة لتسجيل الدخول
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'جاري المعالجة...' : 'إتمام التسجيل'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const { user, refreshCompany } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'currencies'>('companies');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalSectors, setModalSectors] = useState<string[]>([]);

  const sectorsList = [
    'تجاري', 'خدمي', 'صناعي', 'صحي', 'فندقي', 'عقارات', 'اتصالات', 'تكنولوجيا المعلومات',
    'التعدين', 'التعليم', 'زراعة', 'سياحة', 'الصناعات الدوائية والطبية', 'الصناعات الغذائية',
    'البترول والغاز', 'الغزل والنسيج'
  ];

  useEffect(() => {
    if (editingCompany) {
      setModalSectors(editingCompany.sectors ? editingCompany.sectors.split(', ') : []);
    } else if (showAddCompany) {
      setModalSectors([]);
    }
  }, [editingCompany, showAddCompany]);

  const handleModalSectorChange = (sector: string) => {
    setModalSectors(prev => 
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    const res = await fetch('/api/currencies', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      setCurrencies(data);
    }
  };

  const fetchCompanies = async () => {
    const res = await fetch('/api/companies', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      setCompanies(data);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (modalSectors.length === 0) {
      alert('يرجى اختيار قطاع واحد على الأقل');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.sectors = modalSectors.join(', ');
    
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowAddCompany(false);
      fetchCompanies();
    }
  };

  const handleEditCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCompany) return;
    if (modalSectors.length === 0) {
      alert('يرجى اختيار قطاع واحد على الأقل');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.sectors = modalSectors.join(', ');
    
    const res = await fetch(`/api/companies/${editingCompany.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditingCompany(null);
      fetchCompanies();
      if (user?.company_id === editingCompany.id) {
        refreshCompany();
      }
    }
  };

  const handleDeleteCompany = async (id: number) => {
    const company = companies.find(c => c.id === id);
    if (!confirm(`هل أنت متأكد من حذف شركة "${company?.name_ar}"؟ سيؤدي ذلك لحذف جميع البيانات المرتبطة بها.`)) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        fetchCompanies();
      } else {
        const data = await res.json();
        alert(`فشل الحذف: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Delete company error:', error);
      alert('حدث خطأ أثناء محاولة الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowAddUser(false);
      fetchUsers();
    }
  };

  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditingUser(null);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (id: number) => {
    const userToDelete = users.find(u => u.id === id);
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userToDelete?.username}"؟`)) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`فشل الحذف: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('حدث خطأ أثناء محاولة الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto" dir="rtl">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">لوحة تحكم المسؤول</h1>
          <p className="text-slate-500">إدارة الشركات والمستخدمين في النظام</p>
        </div>
      </header>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('companies')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'companies' ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <Building2 className="w-5 h-5" />
          الشركات
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'users' ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <Users className="w-5 h-5" />
          المستخدمين
        </button>
      </div>

      {activeTab === 'companies' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">قائمة الشركات</h2>
            <button 
              onClick={() => setShowAddCompany(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all font-medium"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة شركة
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الشركة</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">النوع</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الدولة / المدينة</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map(company => (
                  <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{company.name_ar}</p>
                          <p className="text-xs text-slate-400">{company.name_en}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{company.company_type || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {company.country}{company.city ? ` / ${company.city}` : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setViewingCompany(company)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all" title="عرض">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingCompany(company)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تعديل">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCompany(company.id)} 
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">قائمة المستخدمين</h2>
            <button 
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all font-medium"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة مستخدم
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">اسم المستخدم</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الشركة</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الدور</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.username}</td>
                    <td className="px-6 py-4 text-slate-600">{user.company_name || 'مسؤول النظام'}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold",
                        user.role === 'admin' ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {user.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "w-2 h-2 rounded-full inline-block ml-2",
                        user.is_active ? "bg-emerald-500" : "bg-slate-300"
                      )} />
                      {user.is_active ? 'نشط' : 'غير نشط'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setViewingUser(user)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all" title="عرض">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تعديل">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)} 
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {viewingCompany && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">تفاصيل الشركة</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">الاسم بالعربي</p>
                    <p className="font-bold text-slate-900">{viewingCompany.name_ar}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">الاسم بالإنجليزي</p>
                    <p className="font-bold text-slate-900">{viewingCompany.name_en}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">النوع</p>
                    <p className="font-bold text-slate-900">{viewingCompany.company_type || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">القطاع</p>
                    <p className="font-bold text-slate-900">{viewingCompany.sectors || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">الدولة</p>
                    <p className="font-bold text-slate-900">{viewingCompany.country || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">المدينة</p>
                    <p className="font-bold text-slate-900">{viewingCompany.city || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">الشارع</p>
                    <p className="font-bold text-slate-900">{viewingCompany.street || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">المبنى</p>
                    <p className="font-bold text-slate-900">{viewingCompany.building_name || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">رقم المبنى</p>
                    <p className="font-bold text-slate-900">{viewingCompany.building_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">الطابق</p>
                    <p className="font-bold text-slate-900">{viewingCompany.floor || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">رقم المكتب</p>
                    <p className="font-bold text-slate-900">{viewingCompany.office_number || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">الهاتف</p>
                    <p className="font-bold text-slate-900">{viewingCompany.phone || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">اسم المفوض</p>
                    <p className="font-bold text-slate-900">{viewingCompany.signatory_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">هاتف المفوض</p>
                    <p className="font-bold text-slate-900">{viewingCompany.signatory_phone || '—'}</p>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-xs text-slate-400 mb-1">تاريخ الإنشاء</p>
                  <p className="font-bold text-slate-900">{format(new Date(viewingCompany.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div className="pt-6">
                  <button onClick={() => setViewingCompany(null)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">إغلاق</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {viewingUser && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">تفاصيل المستخدم</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">اسم المستخدم</p>
                  <p className="font-bold text-slate-900">{viewingUser.username}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">الشركة</p>
                  <p className="font-bold text-slate-900">{viewingUser.company_name || 'مسؤول نظام'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">الدور</p>
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-bold",
                      viewingUser.role === 'admin' ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {viewingUser.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">الحالة</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        viewingUser.is_active ? "bg-emerald-500" : "bg-slate-300"
                      )} />
                      <span className="font-bold text-slate-900">{viewingUser.is_active ? 'نشط' : 'غير نشط'}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <button onClick={() => setViewingUser(null)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">إغلاق</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {(showAddCompany || editingCompany) && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden my-8"
            >
              <form onSubmit={editingCompany ? handleEditCompany : handleAddCompany}>
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <h1 className="text-2xl font-bold text-[#1A1A1A]">{editingCompany ? 'إعدادات الشركة' : 'إضافة شركة جديدة'}</h1>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => { setShowAddCompany(false); setEditingCompany(null); }}
                      className="px-6 py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="bg-[#4F46E5] text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#4338CA] transition-all shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      حفظ
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-12 max-h-[70vh] overflow-y-auto">
                  {/* Dashboard Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-[#4F46E5] border-b border-slate-100 pb-4">
                      <Info className="w-5 h-5" />
                      <h2 className="text-lg font-bold">لوحة التحكم</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">اسم الشركة (بالإنجليزي)</label>
                        <input 
                          name="name_en" 
                          defaultValue={editingCompany?.name_en}
                          required 
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all text-left" 
                          dir="ltr"
                          placeholder="Your Company Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500 block">اسم الشركة (بالعربي)</label>
                        <input 
                          name="name_ar" 
                          defaultValue={editingCompany?.name_ar}
                          required 
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" 
                          placeholder="اسم شركتك"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">العملة الافتراضية</label>
                        <select 
                          name="currency_code" 
                          defaultValue={editingCompany?.currency_code || 'SAR'}
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all"
                        >
                          {currencies.map(curr => (
                            <option key={curr.code} value={curr.code}>
                              {curr.name_ar} ({curr.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Registration Details Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-[#4F46E5] border-b border-slate-100 pb-4">
                      <ClipboardList className="w-5 h-5" />
                      <h2 className="text-lg font-bold">تفاصيل التسجيل</h2>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">نوع الشركة</label>
                        <select 
                          name="company_type" 
                          defaultValue={editingCompany?.company_type}
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all appearance-none"
                        >
                          <option value="">اختر نوع الشركة</option>
                          <option value="مؤسسة فردية">مؤسسة فردية</option>
                          <option value="شركة تضامن">شركة تضامن</option>
                          <option value="شركة توصية بسيطة">شركة توصية بسيطة</option>
                          <option value="شركة ذات مسؤولية محدودة">شركة ذات مسؤولية محدودة</option>
                          <option value="أجنبية فرع عامل">أجنبية فرع عامل</option>
                          <option value="أجنبية فرع غير عامل">أجنبية فرع غير عامل</option>
                          <option value="معفاة">معفاة</option>
                          <option value="شركة غير ربحية">شركة غير ربحية</option>
                          <option value="شركة مناطق حرة">شركة مناطق حرة</option>
                          <option value="شركة استثمار مشترك">شركة استثمار مشترك</option>
                          <option value="شركة مدنية">شركة مدنية</option>
                          <option value="شركة توصية بالأسهم">شركة توصية بالأسهم</option>
                          <option value="مساهمة عامة محدودة">مساهمة عامة محدودة</option>
                          <option value="مساهمة خاصة محدودة">مساهمة خاصة محدودة</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-500">قطاعات الشركة</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {sectorsList.map(sector => (
                            <label key={sector} className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative flex items-center justify-center">
                                <input 
                                  type="checkbox" 
                                  checked={modalSectors.includes(sector)}
                                  onChange={() => handleModalSectorChange(sector)}
                                  className="peer appearance-none w-5 h-5 border border-slate-300 rounded bg-white checked:bg-[#4F46E5] checked:border-[#4F46E5] transition-all"
                                />
                                <CheckCircle2 className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                              </div>
                              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{sector}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Address Details Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-[#4F46E5] border-b border-slate-100 pb-4">
                      <MapPin className="w-5 h-5" />
                      <h2 className="text-lg font-bold">تفاصيل العنوان</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">الدولة</label>
                        <select name="country" defaultValue={editingCompany?.country || 'الأردن'} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all">
                          <option value="الأردن">الأردن</option>
                          <option value="المملكة العربية السعودية">المملكة العربية السعودية</option>
                          <option value="الإمارات العربية المتحدة">الإمارات العربية المتحدة</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">المدينة</label>
                        <input name="city" defaultValue={editingCompany?.city} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">الشارع</label>
                        <input name="street" defaultValue={editingCompany?.street} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">اسم المبنى</label>
                        <input name="building_name" defaultValue={editingCompany?.building_name} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">رقم المبنى</label>
                        <input name="building_number" defaultValue={editingCompany?.building_number} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">الطابق</label>
                        <input name="floor" defaultValue={editingCompany?.floor} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">رقم المكتب/المحل</label>
                        <input name="office_number" defaultValue={editingCompany?.office_number} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-500">رقم الهاتف</label>
                        <input name="phone" defaultValue={editingCompany?.phone} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all text-left" dir="ltr" placeholder="+962 00 000 0000" />
                      </div>
                    </div>
                  </section>

                  {/* Authorized Signatory Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-[#4F46E5] border-b border-slate-100 pb-4">
                      <UserCheck className="w-5 h-5" />
                      <h2 className="text-lg font-bold">المفوض بالتوقيع</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">اسم المفوض</label>
                        <input name="signatory_name" defaultValue={editingCompany?.signatory_name} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">هاتف المفوض</label>
                        <input name="signatory_phone" defaultValue={editingCompany?.signatory_phone} className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] transition-all text-left" dir="ltr" />
                      </div>
                    </div>
                  </section>

                  {/* Branding Section */}
                  <section className="space-y-6">
                    <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-4 text-center">
                        <label className="text-sm font-medium text-slate-500">شعار الشركة</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[#4F46E5] transition-colors cursor-pointer group">
                          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-[#4F46E5]/5 transition-colors">
                            <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-[#4F46E5]" />
                          </div>
                          <input type="hidden" name="logo" defaultValue={editingCompany?.logo} />
                          <span className="text-[#4F46E5] text-sm font-medium">تحميل الصورة</span>
                        </div>
                      </div>
                      <div className="space-y-4 text-center">
                        <label className="text-sm font-medium text-slate-500">أيقونة الموقع</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[#4F46E5] transition-colors cursor-pointer group">
                          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-[#4F46E5]/5 transition-colors">
                            <Settings className="w-6 h-6 text-slate-300 group-hover:text-[#4F46E5]" />
                          </div>
                          <input type="hidden" name="favicon" defaultValue={editingCompany?.favicon} />
                          <span className="text-[#4F46E5] text-sm font-medium">تحميل الصورة</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {(showAddUser || editingUser) && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
              <form onSubmit={editingUser ? handleEditUser : handleAddUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">اسم المستخدم</label>
                  <input name="username" defaultValue={editingUser?.username} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">كلمة المرور {editingUser && '(اتركها فارغة لعدم التغيير)'}</label>
                  <input name="password" type="password" required={!editingUser} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">الشركة</label>
                  <select name="company_id" defaultValue={editingUser?.company_id || ''} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">مسؤول نظام (بدون شركة)</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">الدور</label>
                  <select name="role" defaultValue={editingUser?.role || 'user'} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="user">مستخدم عادي</option>
                    <option value="admin">مسؤول</option>
                  </select>
                </div>
                {editingUser && (
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">الحالة</label>
                    <select name="is_active" defaultValue={editingUser?.is_active} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="1">نشط</option>
                      <option value="0">غير نشط</option>
                    </select>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold">حفظ</button>
                  <button type="button" onClick={() => { setShowAddUser(false); setEditingUser(null); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommitmentsDashboard({ onNavigateToPayment }: { onNavigateToPayment: (number: string) => void }) {
  const { logout, user, company } = useAuth();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return localStorage.getItem('commitment_filter_status') || 'all';
  });
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>(() => {
    const saved = localStorage.getItem('commitment_sort_config');
    return saved ? JSON.parse(saved) : { field: 'due_date', order: 'ASC' };
  });
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [viewingCommitment, setViewingCommitment] = useState<Commitment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCommitments();
  }, [statusFilter, sortConfig]);

  useEffect(() => {
    localStorage.setItem('commitment_filter_status', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('commitment_sort_config', JSON.stringify(sortConfig));
  }, [sortConfig]);

  const fetchCommitments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sortBy', sortConfig.field);
      params.append('order', sortConfig.order);

      const response = await fetch(`/api/commitments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        setCommitments(data);
      } else {
        setCommitments([]);
        if (!response.ok) {
          console.error('API Error:', data.error || response.statusText);
        }
      }
    } catch (error) {
      console.error('Failed to fetch commitments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const handleAddCommitment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = Object.fromEntries(formData.entries());
      
      const url = editingCommitment ? `/api/commitments/${editingCommitment.id}` : '/api/commitments';
      const method = editingCommitment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddCommitment(false);
        setEditingCommitment(null);
        fetchCommitments();
      } else {
        const data = await res.json();
        alert(`فشل العملية: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Commitment operation error:', error);
      alert('حدث خطأ أثناء محاولة تنفيذ العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCommitment = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الالتزام؟')) return;
    
    try {
      const res = await fetch(`/api/commitments/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (res.ok) {
        fetchCommitments();
      } else {
        const data = await res.json();
        alert(`فشل الحذف: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Delete commitment error:', error);
      alert('حدث خطأ أثناء محاولة الحذف');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'نشط': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'مكتمل': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'ملغي': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'مكتمل': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'ملغي': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-6 md:p-10" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">الالتزامات</h1>
              <p className="text-slate-500">إدارة وتتبع التزاماتك المالية بكل سهولة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddCommitment(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-5 h-5" />
              التزام جديد
            </button>
            <button 
              onClick={logout}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="البحث في الالتزامات..." 
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all text-right"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="نشط">نشط</option>
                <option value="مكتمل">مكتمل</option>
                <option value="ملغي">ملغي</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select 
                value={sortConfig.field}
                onChange={(e) => handleSort(e.target.value as SortField)}
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="due_date">تاريخ الاستحقاق</option>
                <option value="created_at">تاريخ الإنشاء</option>
                <option value="amount">المبلغ</option>
                <option value="description">الوصف</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-bottom border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('commit_number' as any)}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    >
                      الرقم المرجعي
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('description')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    >
                      الوصف
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('due_date')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    >
                      تاريخ الاستحقاق
                      {sortConfig.field === 'due_date' && (
                        <span className="text-[10px] mr-1">{sortConfig.order === 'ASC' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                    <button 
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-1 mr-auto hover:text-slate-900 transition-colors"
                    >
                      المبلغ
                      {sortConfig.field === 'amount' && (
                        <span className="text-[10px] mr-1">{sortConfig.order === 'ASC' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                          <p className="text-sm font-medium">جاري تحميل الالتزامات...</p>
                        </div>
                      </td>
                    </tr>
                  ) : commitments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 opacity-20" />
                          <p className="text-sm font-medium">لم يتم العثور على التزامات</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    commitments.map((commitment) => (
                      <motion.tr 
                        key={commitment.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-medium text-slate-500">{commitment.commit_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{commitment.description || 'بدون وصف'}</span>
                            <span className="text-xs text-slate-400">{commitment.account}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4 opacity-40" />
                            {format(new Date(commitment.due_date), 'dd/MM/yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(commitment.amount, company?.currency_code, company?.currency_symbol)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            getStatusColor(commitment.status)
                          )}>
                            {getStatusIcon(commitment.status)}
                            {commitment.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setViewingCommitment(commitment)}
                              className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingCommitment(commitment);
                                setShowAddCommitment(true);
                              }}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50"
                              title="تعديل"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => onNavigateToPayment(commitment.commit_number)}
                              className="text-indigo-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50"
                              title="تسديد دفعة"
                            >
                              <CreditCard className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCommitment(commitment.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                              title="حذف"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Commitment Modal */}
      <AnimatePresence>
        {showAddCommitment && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">{editingCommitment ? 'تعديل التزام' : 'إضافة التزام جديد'}</h2>
              <form onSubmit={handleAddCommitment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">تاريخ الاستحقاق</label>
                    <input 
                      name="due_date" 
                      type="date" 
                      required 
                      defaultValue={editingCommitment?.due_date}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-right" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">المبلغ</label>
                    <div className="relative">
                      <input 
                        name="amount" 
                        type="number" 
                        step="0.01" 
                        required 
                        defaultValue={editingCommitment?.amount}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" 
                        placeholder="0.00" 
                      />
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs">{company?.currency_symbol || company?.currency_code || 'SAR'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">الحساب</label>
                  <input 
                    name="account" 
                    required 
                    defaultValue={editingCommitment?.account}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" 
                    placeholder="اسم الحساب أو البنك" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">الوصف</label>
                  <textarea 
                    name="description" 
                    rows={3} 
                    defaultValue={editingCommitment?.description}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" 
                    placeholder="تفاصيل إضافية عن الالتزام..."
                  ></textarea>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">الحالة</label>
                  <select 
                    name="status" 
                    defaultValue={editingCommitment?.status || 'نشط'} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="نشط">نشط</option>
                    <option value="مكتمل">مكتمل</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : (editingCommitment ? 'حفظ التعديلات' : 'حفظ الالتزام')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddCommitment(false);
                      setEditingCommitment(null);
                    }} 
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Commitment Modal */}
      <AnimatePresence>
        {viewingCommitment && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">تفاصيل الالتزام</h2>
                  <p className="text-slate-500 font-mono text-sm">{viewingCommitment.commit_number}</p>
                </div>
                <button 
                  onClick={() => setViewingCommitment(null)}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">الوصف</label>
                    <p className="text-lg font-medium text-slate-900">{viewingCommitment.description || 'بدون وصف'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">الحساب / البنك</label>
                    <p className="text-slate-700">{viewingCommitment.account}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">تاريخ الاستحقاق</label>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(new Date(viewingCommitment.due_date), 'dd MMMM yyyy')}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">المبلغ الإجمالي</label>
                    <p className="text-3xl font-bold text-slate-900">
                      {formatCurrency(viewingCommitment.amount, company?.currency_code, company?.currency_symbol)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">الحالة</label>
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border",
                      getStatusColor(viewingCommitment.status)
                    )}>
                      {getStatusIcon(viewingCommitment.status)}
                      {viewingCommitment.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setViewingCommitment(null);
                    setEditingCommitment(viewingCommitment);
                    setShowAddCommitment(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                  تعديل
                </button>
                <button 
                  onClick={() => {
                    setViewingCommitment(null);
                    onNavigateToPayment(viewingCommitment.commit_number);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  <CreditCard className="w-5 h-5" />
                  تسديد دفعة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Views ---

function PaymentsView({ preSelectedNumber, onClearPreSelected }: { preSelectedNumber?: string | null, onClearPreSelected?: () => void }) {
  const { company } = useAuth();
  const [searchNumber, setSearchNumber] = useState('');
  const [commitment, setCommitment] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [allCommitments, setAllCommitments] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchAllCommitments();
  }, []);

  useEffect(() => {
    if (preSelectedNumber) {
      setSearchNumber(preSelectedNumber);
      performSearch(preSelectedNumber);
      if (onClearPreSelected) onClearPreSelected();
    }
  }, [preSelectedNumber]);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const fetchAllCommitments = async () => {
    try {
      const res = await fetch('/api/commitments?status=نشط', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllCommitments(data);
      }
    } catch (err) {
      console.error('Failed to fetch all commitments:', err);
    }
  };

  const performSearch = async (number: string) => {
    setLoading(true);
    setError('');
    setCommitment(null);
    setSuccess('');

    try {
      const res = await fetch(`/api/commitments/search/${number}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCommitment(data);
      } else {
        try {
          const data = await res.json();
          setError(data.error || 'فشل العثور على الالتزام');
        } catch (e) {
          setError('فشل العثور على الالتزام');
        }
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNumber) return;
    performSearch(searchNumber);
  };

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commitment) return;

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    
    if (amount <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (amount > commitment.remainingAmount) {
      setError('المبلغ المدفوع أكبر من المبلغ المتبقي');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          commitment_id: commitment.id,
          amount,
          method: formData.get('method'),
          payment_date: formData.get('payment_date')
        }),
      });

      if (res.ok) {
        setSuccess('تم تسجيل الدفعة بنجاح');
        setCommitment(null);
        setSearchNumber('');
        fetchPayments();
      } else {
        const data = await res.json();
        setError(data.error || 'فشل تسجيل الدفعة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدفعة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto" dir="rtl">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">المدفوعات</h1>
          <p className="text-slate-500">تسديد الالتزامات وتتبع سجل الدفع</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
        >
          <History className="w-5 h-5" />
          {showHistory ? 'نموذج الدفع' : 'سجل المدفوعات'}
        </button>
      </header>

      {showHistory ? (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">رقم الالتزام</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الوصف</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">المبلغ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">طريقة الدفع</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">لا يوجد سجل مدفوعات حتى الآن</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{p.commit_number}</td>
                    <td className="px-6 py-4 text-slate-600">{p.commitment_description}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(p.amount, company?.currency_code, company?.currency_symbol)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">{p.method}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {format(new Date(p.payment_date), 'dd/MM/yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                البحث عن التزام
              </h3>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">اختر الالتزام</label>
                  <select 
                    value={searchNumber}
                    onChange={(e) => {
                      setSearchNumber(e.target.value);
                      if (e.target.value) performSearch(e.target.value);
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  >
                    <option value="">اختر من القائمة...</option>
                    {allCommitments.map(c => (
                      <option key={c.id} value={c.commit_number}>
                        {c.commit_number} - {c.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex items-center gap-2 py-2">
                  <div className="flex-1 h-px bg-slate-100"></div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">أو البحث بالرقم</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">رقم الالتزام</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchNumber}
                      onChange={(e) => setSearchNumber(e.target.value)}
                      placeholder="مثال: 2026-02-001"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                    />
                    <button 
                      type="submit"
                      disabled={loading || !searchNumber}
                      className="absolute left-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      {loading ? '...' : 'بحث'}
                    </button>
                  </div>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {success}
                </div>
              )}
            </div>

            {commitment && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-600 text-white rounded-3xl p-8 shadow-xl shadow-indigo-600/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border border-white/20",
                    commitment.status === 'مكتمل' ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10"
                  )}>
                    {commitment.status}
                  </span>
                </div>
                <div className="space-y-1 mb-6">
                  <p className="text-indigo-100 text-sm">المبلغ المتبقي</p>
                  <h4 className="text-3xl font-bold">
                    {formatCurrency(commitment.remainingAmount, company?.currency_code, company?.currency_symbol)}
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-indigo-200 text-xs mb-1">إجمالي الالتزام</p>
                    <p className="font-bold">{formatCurrency(commitment.amount, company?.currency_code, company?.currency_symbol)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs mb-1">تم دفع</p>
                    <p className="font-bold">{formatCurrency(commitment.totalPaid, company?.currency_code, company?.currency_symbol)}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Payment Form Section */}
          <div className="lg:col-span-2">
            {commitment ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-indigo-600" />
                  نموذج تسديد دفعة
                </h3>
                <form onSubmit={handlePayment} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-500">المبلغ المراد دفعه</label>
                      <div className="relative">
                        <input 
                          name="amount"
                          type="number" 
                          step="0.01"
                          max={commitment.remainingAmount}
                          defaultValue={commitment.remainingAmount}
                          required
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg"
                        />
                        <span className="absolute left-4 top-4 text-slate-400">{company?.currency_symbol || company?.currency_code || 'SAR'}</span>
                      </div>
                      <p className="text-xs text-slate-400">يمكنك دفع جزء من المبلغ أو المبلغ كاملاً</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-500">تاريخ الدفع</label>
                      <input 
                        name="payment_date"
                        type="date" 
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">طريقة الدفع</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['نقدي', 'تحويل بنكي', 'شيك', 'بطاقة ائتمان'].map((method) => (
                        <label key={method} className="relative flex items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all group">
                          <input type="radio" name="method" value={method} defaultChecked={method === 'نقدي'} className="peer hidden" />
                          <div className="absolute inset-0 border-2 border-transparent peer-checked:border-indigo-600 rounded-xl transition-all" />
                          <span className="text-sm font-bold text-slate-600 peer-checked:text-indigo-600">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CreditCard className="w-5 h-5" />
                      {submitting ? 'جاري المعالجة...' : 'تأكيد عملية الدفع'}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <Banknote className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">بانتظار اختيار التزام</h3>
                <p className="text-slate-400 max-w-xs">يرجى البحث عن التزام باستخدام رقمه للبدء في عملية التسديد</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsView() {
  return (
    <div className="p-10 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">التقارير</h1>
      <p className="text-slate-500">تقارير تحليلية مفصلة عن الالتزامات والمدفوعات</p>
      <div className="mt-10 bg-white border border-slate-200 rounded-3xl p-20 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">قريباً</h3>
        <p className="text-slate-500">هذه الصفحة قيد التطوير حالياً</p>
      </div>
    </div>
  );
}

function SettingsView() {
  const { company, refreshCompany } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/currencies', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!company) return;

    setLoading(true);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const updates = Object.fromEntries(formData.entries());

      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...company,
          ...updates
        }),
      });

      if (res.ok) {
        await refreshCompany();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto" dir="rtl">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">الإعدادات</h1>
        <p className="text-slate-500">تخصيص إعدادات الشركة والعملة</p>
      </header>

      <form onSubmit={handleUpdateSettings} className="space-y-8">
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">معلومات الشركة</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">اسم الشركة (بالعربي)</label>
              <input 
                name="name_ar" 
                defaultValue={company?.name_ar}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">اسم الشركة (بالإنجليزي)</label>
              <input 
                name="name_en" 
                defaultValue={company?.name_en}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-left"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">رقم الهاتف</label>
              <input 
                name="phone" 
                defaultValue={company?.phone}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-left"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">المدينة</label>
              <input 
                name="city" 
                defaultValue={company?.city}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Banknote className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">إعدادات العملة</h2>
          </div>

          <div className="max-w-md space-y-2">
            <label className="text-sm font-medium text-slate-500">العملة الافتراضية للشركة</label>
            <select 
              name="currency_code" 
              defaultValue={company?.currency_code || 'SAR'}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
            >
              {currencies.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.name_ar} ({curr.symbol})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400">سيتم استخدام هذه العملة في جميع التقارير والالتزامات والمدفوعات الخاصة بالشركة.</p>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button 
            type="submit"
            disabled={loading}
            className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-slate-900/20"
          >
            <Save className="w-5 h-5" />
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
          
          {success && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-emerald-600 font-bold flex items-center gap-2 bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-100"
            >
              <CheckCircle2 className="w-5 h-5" />
              تم حفظ التغييرات بنجاح
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
}

function UserDashboard() {
  const { user, company } = useAuth();
  const [stats, setStats] = useState<{
    active_count: number;
    completed_count: number;
    total_amount: number;
    total_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/reports/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">لوحة التحكم</h1>
      <p className="text-slate-500">مرحباً بك، {user?.username}. إليك ملخص سريع لالتزامات شركتك.</p>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-4" />
              <div className="h-4 bg-slate-100 rounded w-24 mb-2" />
              <div className="h-8 bg-slate-100 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-slate-500 font-bold text-sm mb-1">التزامات نشطة</h3>
            <p className="text-3xl font-bold text-slate-900">{stats?.active_count || 0}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-slate-500 font-bold text-sm mb-1">التزامات مكتملة</h3>
            <p className="text-3xl font-bold text-slate-900">{stats?.completed_count || 0}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-slate-500 font-bold text-sm mb-1">إجمالي المبالغ</h3>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(stats?.total_amount || 0, company?.currency_code, company?.currency_symbol)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

type View = 'dashboard' | 'commitments' | 'admin' | 'payments' | 'reports' | 'settings';

function Sidebar({ activeView, setView }: { activeView: View, setView: (v: View) => void }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'commitments', label: 'الالتزامات', icon: Calendar },
    { id: 'payments', label: 'المدفوعات', icon: Clock },
    { id: 'reports', label: 'التقارير', icon: Users },
    { id: 'settings', label: 'الإعدادات', icon: Lock },
  ];

  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col h-screen sticky top-0" dir="rtl">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">نظام الالتزامات</span>
        </div>

        <nav className="space-y-2">
          {user?.role === 'admin' && (
            <button 
              onClick={() => setView('admin')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all mb-4",
                activeView === 'admin' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              )}
            >
              <ShieldCheck className="w-5 h-5" />
              إدارة النظام (المسؤول)
            </button>
          )}

          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                activeView === item.id ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{user?.username}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{user?.role === 'admin' ? 'مسؤول نظام' : 'مستخدم'}</span>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [preSelectedCommitmentNumber, setPreSelectedCommitmentNumber] = useState<string | null>(null);

  const handleNavigateToPayment = (number: string) => {
    setPreSelectedCommitmentNumber(number);
    setView('payments');
  };

  if (!user) {
    return authMode === 'login' 
      ? <LoginForm onSwitch={() => setAuthMode('register')} /> 
      : <RegisterForm onSwitch={() => setAuthMode('login')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      <Sidebar activeView={view} setView={setView} />
      
      <main className="flex-1 overflow-y-auto">
        {view === 'admin' && user.role === 'admin' && <AdminDashboard />}
        {view === 'dashboard' && <UserDashboard />}
        {view === 'commitments' && (
          <CommitmentsDashboard onNavigateToPayment={handleNavigateToPayment} />
        )}
        {view === 'payments' && (
          <PaymentsView 
            preSelectedNumber={preSelectedCommitmentNumber} 
            onClearPreSelected={() => setPreSelectedCommitmentNumber(null)} 
          />
        )}
        {view === 'reports' && <ReportsView />}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
