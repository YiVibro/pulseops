// src/components/ServerList.tsx
import React from 'react';
import { useServers } from '../hooks/useServers';

export const ServerList: React.FC = () => {
  const { servers, loading, error } = useServers();

  if (loading) {
    return <div className="p-4 text-gray-400">Loading active servers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Failed to load servers: {error}</div>;
  }

  if (servers.length === 0) {
    return (
      <div className="p-4 text-yellow-400">
        No active servers found. Run the install script on a machine to connect it!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {servers.map((server) => (
        <div
          key={server.id}
          className="border border-gray-700 bg-gray-900 rounded-lg p-4 shadow-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{server.name}</h3>
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  server.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-sm text-gray-400 font-mono mt-1">ID: {server.id}</p>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-800 text-xs text-gray-500">
            Status: <span className="text-gray-300 capitalize">{server.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};