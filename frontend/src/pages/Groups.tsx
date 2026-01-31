import { useEffect, useState } from 'react';
import { groups } from '../services/api';

interface Group {
  id: string;
  name: string;
  description: string;
  member_count: string;
  member_role: string;
}

export default function Groups() {
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPrivate: false });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await groups.getMyGroups();
      setMyGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchGroups = async () => {
    if (!searchQuery.trim()) return;
    try {
      const { data } = await groups.search(searchQuery);
      setSearchResults(data);
    } catch (error) {
      console.error('Failed to search groups:', error);
    }
  };

  const createGroup = async () => {
    try {
      await groups.create(newGroup);
      setShowCreateForm(false);
      setNewGroup({ name: '', description: '', isPrivate: false });
      fetchGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      await groups.join(groupId);
      fetchGroups();
      setSearchResults(searchResults.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      await groups.leave(groupId);
      fetchGroups();
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <button onClick={() => setShowCreateForm(true)} className="btn-primary">
          + Create Group
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Create New Group</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Group Name</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="input"
                placeholder="Gym Bros"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                className="input"
                rows={2}
                placeholder="What's this group about?"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={newGroup.isPrivate}
                onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-700">Private group (invite only)</label>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button onClick={createGroup} className="btn-primary">Create</button>
            <button onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Find Groups</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchGroups()}
            className="input flex-1"
            placeholder="Search public groups..."
          />
          <button onClick={searchGroups} className="btn-primary">Search</button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((group) => (
              <div key={group.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{group.name}</div>
                  <div className="text-sm text-gray-500">{group.member_count} members</div>
                </div>
                <button onClick={() => joinGroup(group.id)} className="btn-primary text-sm">
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Groups */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">My Groups</h2>
        {myGroups.length === 0 ? (
          <p className="text-gray-500">You haven't joined any groups yet.</p>
        ) : (
          <div className="space-y-3">
            {myGroups.map((group) => (
              <div key={group.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{group.name}</div>
                  <div className="text-sm text-gray-500">
                    {group.member_count} members • {group.member_role}
                  </div>
                  {group.description && (
                    <div className="text-sm text-gray-600 mt-1">{group.description}</div>
                  )}
                </div>
                {group.member_role !== 'owner' && (
                  <button onClick={() => leaveGroup(group.id)} className="text-sm text-red-600 hover:text-red-700">
                    Leave
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
