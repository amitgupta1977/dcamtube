'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const INCIDENT_TYPES = [
  'Accident', 'Road rage', 'Traffic Violation', 'Traffic Jam', 'Road complaint', 'Scenic view', 'Other'
];

const COUNTRIES = [
  'India', 'USA', 'UK', 'Australia', 'Canada', 'Germany', 'France', 'Japan', 'China', 'Brazil',
  'Mexico', 'Spain', 'Italy', 'South Korea', 'Singapore', 'UAE', 'Saudi Arabia', 'Russia'
];

export default function UploadPage() {
  const router = useRouter();
  const { user, updatePoints } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<string>('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [road, setRoad] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [roadSuggestions, setRoadSuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showRoadSuggestions, setShowRoadSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      if (city.length >= 2) {
        const res = await fetch(`/api/suggestions/cities?q=${encodeURIComponent(city)}`);
        const data = await res.json();
        setCitySuggestions(data.cities || []);
        setShowCitySuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [city]);

  useEffect(() => {
    async function fetchSuggestions() {
      if (road.length >= 2 && city) {
        const res = await fetch(`/api/suggestions/roads?q=${encodeURIComponent(road)}&city=${encodeURIComponent(city)}`);
        const data = await res.json();
        setRoadSuggestions(data.roads || []);
        setShowRoadSuggestions(true);
      } else if (road.length >= 2) {
        const res = await fetch(`/api/suggestions/roads?q=${encodeURIComponent(road)}`);
        const data = await res.json();
        setRoadSuggestions(data.roads || []);
        setShowRoadSuggestions(true);
      } else {
        setRoadSuggestions([]);
        setShowRoadSuggestions(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [road, city]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-[#aaa]">Please login to upload videos.</p>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }
      setFile(selected);
      const objectUrl = URL.createObjectURL(selected);
      setPreview(objectUrl);
      setError('');
      
      // Auto-generate thumbnail after a short delay
      setTimeout(() => captureThumbnail(objectUrl), 500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('video/')) {
      setFile(dropped);
      const objectUrl = URL.createObjectURL(dropped);
      setPreview(objectUrl);
      setError('');
      
      // Auto-generate thumbnail after a short delay
      setTimeout(() => captureThumbnail(objectUrl), 500);
    }
  };

  const captureThumbnail = (videoSrc?: string) => {
    const src = videoSrc || preview;
    if (!src) return;
    const video = document.createElement('video');
    video.src = src;
    video.currentTime = 1;
    video.crossOrigin = 'anonymous';
    
    video.addEventListener('loadeddata', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnail(dataUrl);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !country || !city || !road || !incidentType || !incidentDate) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        setError(uploadData.error || 'Failed to upload video');
        setLoading(false);
        return;
      }

      const videoUrl = uploadData.videoUrl;
      const thumbnailUrl = thumbnail || videoUrl;

      const video = document.createElement('video');
      video.src = preview;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          resolve();
        };
      });

      const duration = Math.floor(video.duration);

      const token = localStorage.getItem('godashreel_token');
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description,
          videoUrl,
          thumbnailUrl,
          duration,
          country,
          city,
          road,
          incidentType,
          incidentDate
        })
      });

      const data = await res.json();

      if (data.ok) {
        alert('Video uploaded successfully! Waiting for admin approval. You will earn 100 reward points once approved!');
        router.push('/');
      } else {
        setError(data.error || 'Failed to create video');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
        <p className="text-[#aaa] mb-8">Share road incidents with the community and earn 100 points!</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#333] rounded-xl p-8 text-center cursor-pointer hover:border-[#E53935] transition-colors min-h-[300px] flex flex-col items-center justify-center bg-[#1a1a1a]"
            >
              {preview ? (
                <div className="w-full">
                  <video src={preview} className="w-full rounded-lg max-h-[200px] object-contain" />
                  <p className="text-[#4CAF50] mt-2 text-sm">{file?.name}</p>
                </div>
              ) : (
                <>
                  <svg className="w-16 h-16 mx-auto text-[#444] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <p className="text-[#aaa]">Drop your video here or click to browse</p>
                  <p className="text-[#666] text-sm mt-2">MP4, MOV, AVI (max 100MB)</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Country *</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                  required
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-white font-medium mb-2">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                  placeholder="e.g., New York"
                  className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                  required
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-[#1a1a1a] border border-[#333] rounded-lg mt-1 max-h-48 overflow-y-auto">
                    {citySuggestions.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setCity(c); setShowCitySuggestions(false); }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-[#333] first:rounded-t-lg last:rounded-b-lg"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-white font-medium mb-2">Road Name *</label>
                <input
                  type="text"
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                  onFocus={() => roadSuggestions.length > 0 && setShowRoadSuggestions(true)}
                  placeholder="e.g., Highway 101"
                  className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                  required
                />
                {showRoadSuggestions && roadSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-[#1a1a1a] border border-[#333] rounded-lg mt-1 max-h-48 overflow-y-auto">
                    {roadSuggestions.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setRoad(r); setShowRoadSuggestions(false); }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-[#333] first:rounded-t-lg last:rounded-b-lg"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Incident Type *</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                    required
                  >
                    <option value="">Select...</option>
                    {INCIDENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Vehicle Number (Optional)</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC-1234"
                  className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                />
                <p className="text-[#666] text-xs mt-1">This will only be visible to admin</p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about the incident..."
                  rows={2}
                  className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333]"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-[#F44336]">{error}</p>
          )}

          <div className="bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-3 border border-[#333]">
            <svg className="w-8 h-8 text-[#FFCA28]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            <div>
              <p className="text-white font-medium">Earn 100 Reward Points!</p>
              <p className="text-[#aaa] text-sm">Upload a video and get <span className="text-[#FFCA28] font-bold">100 points</span> once approved!</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-[#E53935] hover:bg-[#C62828] disabled:bg-[#444] text-white py-4 rounded-lg font-bold text-lg transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload Video & Earn 100 Points'}
          </button>
        </form>
      </div>
    </div>
  );
}
