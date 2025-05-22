import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GreenhouseDashboard = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/integrations/greenhouse/jobs');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching jobs');
      setData([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    }
  }, [activeTab]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Greenhouse Integration</h1>

      <div className="mb-4">
        <button onClick={() => setActiveTab('jobs')} className={`mr-2 px-4 py-2 rounded ${activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Jobs
        </button>
        <button onClick={() => setActiveTab('candidates')} className={`mr-2 px-4 py-2 rounded ${activeTab === 'candidates' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Candidates
        </button>
        <button onClick={() => setActiveTab('applications')} className={`mr-2 px-4 py-2 rounded ${activeTab === 'applications' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Applications
        </button>
        <button onClick={() => setActiveTab('triggers')} className={`px-4 py-2 rounded ${activeTab === 'triggers' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Triggers
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {data.length === 0 && !error && <p>No job listings found.</p>}
          {data.map((job) => (
            <div key={job.id} className="border p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              <p>Department: {job.department?.name || 'N/A'}</p>
              <p>Status: {job.status}</p>
              <p>ID: {job.id}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab !== 'jobs' && (
        <p className="text-gray-500">Coming soon: {activeTab} data</p>
      )}
    </div>
  );
};

export default GreenhouseDashboard;
