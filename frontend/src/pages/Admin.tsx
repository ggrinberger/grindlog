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
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats?.newUsersToday || 0}</div>
          <div className="text-sm text-gray-500">New Today</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600">{stats?.activeUsersWeek || 0}</div>
          <div className="text-sm text-gray-500">Active (7d)</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-emerald-600">{stats?.totalWorkouts || 0}</div>
          <div className="text-sm text-gray-500">Workouts</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-orange-600">{stats?.totalDietLogs || 0}</div>
          <div className="text-sm text-gray-500">Diet Logs</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-pink-600">{stats?.totalGroups || 0}</div>
          <div className="text-sm text-gray-500">Groups</div>
        </div>
      </div>

      {/* User Management */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">User Management</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            className="input flex-1"
            placeholder="Search users..."
          />
          <button onClick={searchUsers} className="btn-primary">Search</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2">User</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Workouts</th>
                <th className="pb-2">Joined</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{user.display_name || user.username}</div>
                    <div className="text-gray-500">@{user.username}</div>
                  </td>
                  <td className="py-3 text-gray-600">{user.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3">{user.workout_count}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
