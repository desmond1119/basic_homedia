/**
 * UserList Component
 * Displays list of users with loading and error states
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchAllUsers } from '../store/userSlice';

export const UserList = () => {
  const dispatch = useAppDispatch();
  const { users, fetchAll } = useAppSelector((state) => state.users);

  useEffect(() => {
    void dispatch(fetchAllUsers());
  }, [dispatch]);

  if (fetchAll.status === 'pending') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  if (fetchAll.status === 'failed') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">Error: {fetchAll.error}</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No users found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Users</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
