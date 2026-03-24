"use client";
import { useEffect, useState } from 'react';

export default function DownloadsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/downloads/pending', { headers: { 'Authorization': `Bearer ${localStorage.getItem('godashreel_token')}` } })
      .then(r => r.json())
      .then(d => setRequests(d.requests || []));
  }, []);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Downloads</h1>
      {requests.length === 0 ? (
        <p>No pending download requests</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(r => (
            <div key={r.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
              <div className="text-sm text-[#ddd]">Video: {r.video?.id}</div>
              <div className="text-sm text-[#ddd]">Gov: {r.governmentUser?.email}</div>
              <div className="mt-2 flex gap-2">
                <button className="bg-green-600 px-3 py-1 rounded">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
