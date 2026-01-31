import { useEffect, useState } from 'react';
import { admin } from '../services/api';

interface Stats {
  totalUsers: number;
  totalGroups: number;
  totalWorkouts: number;
  totalDietLogs: number;
  newUsersToday: number;
  activeUsersWeek: number;
}

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
  workout_count: string;
}

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        admin.getStats(),
        admin.getUsers(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const { data } = await admin.getUsers(50, 0, searchQuery);
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await admin.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 skeleton rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 skeleton rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage users and monitor app activity.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="stat-card flex-col items-start">
          <div className="stat-icon stat-icon-blue mb-2">👥</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </div>
        <div className="stat-card flex-col items-start">
          <div className="stat-icon stat-icon-emerald mb-2">✨</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.newUsersToday || 0}</div>
          <div className="text-sm text-slate-500">New Today</div>
        </div>
        <div className="stat-card flex-col items-start">
          <div className="stat-icon stat-icon-purple mb-2">🔥</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.activeUsersWeek || 0}</div>
          <div className="text-sm text-slate-500">Active (7d)</div>
        </div>
        <div className="stat-card flex-col items-start">
          <div className="stat-icon stat-icon-orange mb-2">🏋️</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalWorkouts || 0}</div>
          <div className="text-sm text-slate-500">Workouts</div>
        </div>
        <div className="stat-card flex-col items-start">
          <div className="stat-icon stat-icon-pink mb-2">🥗</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalDietLogs || 0}</div>
          <div className="text-sm text-slate-500">Diet Logs</div>
        </div>
        <div className="stat-card flex-col items-start">
          <div className="stat-icon stat-icon-blue mb-2">🌐</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalGroups || 0}</div>
          <div className="text-sm text-slate-500">Groups</div>
        </div>
      </div>

      {/* User Management */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              className="input !py-2 !w-auto"
              placeholder="Search users..."
            />
            <button onClick={searchUsers} className="btn-secondary !py-2">
              Search
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th className="hidden sm:table-cell">Email</th>
                <th>Role</th>
                <th className="hidden md:table-cell">Workouts</th>
                <th className="hidden lg:table-cell">Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600">
                          {(user.display_name || user.username)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.display_name || user.username}</div>
                        <div className="text-xs text-slate-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell text-slate-600">{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-gray'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="hidden md:table-cell text-slate-600">{user.workout_count}</td>
                  <td className="hidden lg:table-cell text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No users found</div>
            <div className="empty-state-text">Try a different search term.</div>
          </div>
        )}
      </div>
    </div>
  );
}
