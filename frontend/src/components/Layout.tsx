import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useEffect } from 'react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  // Apply theme on mount
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Check system preference on first load
  useEffect(() => {
    const stored = localStorage.getItem('grindlog-theme');
    if (!stored) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark);
    }
  }, [setTheme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '📊', mobileLabel: 'Home' },
    { to: '/weekly-plan', label: 'Training Plan', icon: '🏋️', mobileLabel: 'Train' },
    { to: '/routines', label: 'Routines', icon: '☀️', mobileLabel: 'Routines' },
    { to: '/cardio', label: 'Cardio', icon: '❤️', mobileLabel: 'Cardio' },
    { to: '/nutrition', label: 'Nutrition', icon: '🥗', mobileLabel: 'Food' },
    { to: '/supplements', label: 'Supplements', icon: '💊', mobileLabel: 'Supps' },
    { to: '/progress', label: 'Progress', icon: '📈', mobileLabel: 'Progress' },
    { to: '/groups', label: 'Groups', icon: '👥', mobileLabel: 'Groups' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: '⚙️', mobileLabel: 'Admin' });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-0 transition-colors duration-200">
      {/* Desktop header */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <span className="text-white text-lg">💪</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  GrindLog
                </span>
              </div>
              <div className="hidden md:flex ml-10 space-x-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                  {user?.displayName || user?.username}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/50 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-3 py-2 rounded-xl min-w-[60px] transition-all ${
                  isActive 
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                }`
              }
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.mobileLabel}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
