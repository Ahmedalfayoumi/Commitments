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
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  created_at: string;
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
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
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
    <AuthContext.Provider value={{ user, token, login, logout }}>
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

function LoginForm() {
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
        </form>
      </motion.div>
    </div>
  );
}

function AdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, []);

  const fetchCompanies = async () => {
    const res = await fetch('/api/companies', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    const data = await res.json();
    setCompanies(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    const data = await res.json();
    setUsers(data);
  };

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
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
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
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
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">{editingCompany ? 'تعديل شركة' : 'إضافة شركة جديدة'}</h2>
              <form onSubmit={editingCompany ? handleEditCompany : handleAddCompany} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">الاسم بالعربي</label>
                    <input name="name_ar" defaultValue={editingCompany?.name_ar} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">الاسم بالإنجليزي</label>
                    <input name="name_en" defaultValue={editingCompany?.name_en} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">النوع</label>
                    <input name="company_type" defaultValue={editingCompany?.company_type} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">القطاع</label>
                    <input name="sectors" defaultValue={editingCompany?.sectors} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">الدولة</label>
                    <input name="country" defaultValue={editingCompany?.country} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">المدينة</label>
                    <input name="city" defaultValue={editingCompany?.city} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">الشارع</label>
                    <input name="street" defaultValue={editingCompany?.street} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">اسم المبنى</label>
                    <input name="building_name" defaultValue={editingCompany?.building_name} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">رقم المبنى</label>
                    <input name="building_number" defaultValue={editingCompany?.building_number} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">الطابق</label>
                    <input name="floor" defaultValue={editingCompany?.floor} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">رقم المكتب</label>
                    <input name="office_number" defaultValue={editingCompany?.office_number} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">رقم الهاتف</label>
                  <input name="phone" defaultValue={editingCompany?.phone} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">اسم المفوض</label>
                    <input name="signatory_name" defaultValue={editingCompany?.signatory_name} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">هاتف المفوض</label>
                    <input name="signatory_phone" defaultValue={editingCompany?.signatory_phone} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">رابط الشعار (Logo URL)</label>
                    <input name="logo" defaultValue={editingCompany?.logo} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">رابط الأيقونة (Favicon URL)</label>
                    <input name="favicon" defaultValue={editingCompany?.favicon} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold">حفظ</button>
                  <button type="button" onClick={() => { setShowAddCompany(false); setEditingCompany(null); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">إلغاء</button>
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

function CommitmentsDashboard() {
  const { logout, user } = useAuth();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return localStorage.getItem('commitment_filter_status') || 'all';
  });
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>(() => {
    const saved = localStorage.getItem('commitment_sort_config');
    return saved ? JSON.parse(saved) : { field: 'due_date', order: 'ASC' };
  });

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
            <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95">
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
                            {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(commitment.amount)}
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
                          <button className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-white">
                            <ChevronDown className="w-5 h-5" />
                          </button>
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
    </div>
  );
}

// --- Views ---

function PaymentsView() {
  return (
    <div className="p-10 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">المدفوعات</h1>
      <p className="text-slate-500">تتبع وإدارة عمليات الدفع الخاصة بالالتزامات</p>
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
  return (
    <div className="p-10 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">الإعدادات</h1>
      <p className="text-slate-500">تخصيص إعدادات الحساب والشركة</p>
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

function UserDashboard() {
  const { user } = useAuth();
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
      const data = await res.json();
      if (res.ok) {
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
              {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(stats?.total_amount || 0)}
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

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      <Sidebar activeView={view} setView={setView} />
      
      <main className="flex-1 overflow-y-auto">
        {view === 'admin' && user.role === 'admin' && <AdminDashboard />}
        {view === 'dashboard' && <UserDashboard />}
        {view === 'commitments' && <CommitmentsDashboard />}
        {view === 'payments' && <PaymentsView />}
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
