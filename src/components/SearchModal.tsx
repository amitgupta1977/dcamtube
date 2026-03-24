'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  onClose: () => void;
}

const INCIDENT_TYPES = [
  'Accident', 'Road rage', 'Traffic Violation', 'Traffic Jam', 'Road complaint', 'Scenic view', 'Other'
];

export default function SearchModal({ onClose }: SearchModalProps) {
  const router = useRouter();
  const [searchBy, setSearchBy] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<Record<string, string>>({});

  const allCriteria = [
    { key: 'city', label: 'City', options: [] },
    { key: 'road', label: 'Road', options: [] },
    { key: 'incidentType', label: 'Incident Type', options: INCIDENT_TYPES },
    { key: 'date', label: 'Date', type: 'date' }
  ];

  const handleAddCriterion = (key: string) => {
    if (searchBy.length < 2 && !searchBy.includes(key)) {
      setSearchBy([...searchBy, key]);
    }
  };

  const handleRemoveCriterion = (key: string) => {
    setSearchBy(searchBy.filter(k => k !== key));
    const newCriteria = { ...criteria };
    delete newCriteria[key];
    setCriteria(newCriteria);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    if (searchBy.length >= 2) {
      router.push(`/search?${params.toString()}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#252525] rounded-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Search Videos</h2>
          <button onClick={onClose} className="text-[#B0B0B0] hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <p className="text-[#B0B0B0] mb-4">Select at least 2 criteria to search:</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {allCriteria.map(c => (
            <button
              key={c.key}
              onClick={() => handleAddCriterion(c.key)}
              disabled={searchBy.length >= 2 || searchBy.includes(c.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchBy.includes(c.key)
                  ? 'bg-[#E53935] text-white'
                  : searchBy.length >= 2
                  ? 'bg-[#303030] text-[#666] cursor-not-allowed'
                  : 'bg-[#303030] text-[#B0B0B0] hover:bg-[#404040]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          {searchBy.map(key => {
            const criterion = allCriteria.find(c => c.key === key);
            return (
              <div key={key} className="flex items-center gap-3">
                <label className="text-[#B0B0B0] w-28 shrink-0">{criterion?.label}</label>
                {criterion?.key === 'incidentType' ? (
                  <select
                    value={criteria[key] || ''}
                    onChange={(e) => setCriteria({ ...criteria, [key]: e.target.value })}
                    className="flex-1 bg-[#303030] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935]"
                  >
                    <option value="">Select...</option>
                    {criterion.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : criterion?.key === 'date' ? (
                  <input
                    type="date"
                    value={criteria[key] || ''}
                    onChange={(e) => setCriteria({ ...criteria, [key]: e.target.value })}
                    className="flex-1 bg-[#303030] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935]"
                  />
                ) : (
                  <input
                    type="text"
                    value={criteria[key] || ''}
                    onChange={(e) => setCriteria({ ...criteria, [key]: e.target.value })}
                    placeholder={`Enter ${criterion?.label.toLowerCase()}...`}
                    className="flex-1 bg-[#303030] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935]"
                  />
                )}
                <button
                  onClick={() => handleRemoveCriterion(key)}
                  className="text-[#F44336] hover:text-[#D32F2F]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSearch}
          disabled={searchBy.length < 2}
          className="w-full bg-[#E53935] hover:bg-[#C62828] disabled:bg-[#666] disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
        >
          {searchBy.length < 2 ? `Select ${2 - searchBy.length} more criteria` : 'Search Videos'}
        </button>
      </div>
    </div>
  );
}
