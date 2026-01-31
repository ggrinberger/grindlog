import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useEffect, useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  // Bottom nav items (first 5 for mobile)
  const bottomNavItems = navItems.slice(0, 5);
  const moreNavItems = navItems.slice(5);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-0 transition-colors duration-300">
      {/* Desktop header */}
      <nav className="glass dark:glass-dark border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-105">
                  <span className="text-white text-lg">💪</span>
                </div>
                <span className="text-xl font-bold gradient-text hidden sm:block">
                  GrindLog
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-10 space-x-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `nav-link px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn-icon"
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
              
              {/* Profile */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-inner-soft">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                  {user?.displayName || user?.username}
                </span>
              </Link>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="hidden sm:block text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass dark:glass-dark border-t border-slate-200/50 dark:border-slate-800/50 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 rounded-xl min-w-[56px] transition-all duration-200 ${
                  isActive 
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 scale-105' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 active:scale-95'
                }`
              }
            >
              <span className="text-xl mb-0.5 transition-transform">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.mobileLabel}</span>
            </NavLink>
          ))}
          
          {/* More menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl min-w-[56px] transition-all duration-200 ${
              mobileMenuOpen
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="text-xl mb-0.5">⋯</span>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="absolute bottom-20 left-4 right-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-3 mb-4">
              {moreNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center py-4 px-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95'
                    }`
                  }
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
            
            {/* Profile & Logout in More menu */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
                  <span className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{user?.displayName || user?.username}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">View profile</div>
                </div>
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium active:scale-[0.98] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
