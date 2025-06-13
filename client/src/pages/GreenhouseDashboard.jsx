import React, { useState, useEffect } from 'react';
import axiosWithAuth from '../utils/axiosWithAuth';
import ClientHeader from '../components/ClientHeader';

const GreenhouseDashboard = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [allData, setAllData] = useState({
    candidates: [],
    jobs: [],
    applications: [],
    offers: [],
    offices: [],
    departments: [],
    customFields: []
  });

  const fetchData = async (endpoint) => {
    try {
      const axiosAuth = axiosWithAuth();
      const response = await axiosAuth.get(`/api/integrations/greenhouse/${endpoint}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || `Error fetching ${endpoint}`);
      setData([]);
    }
  };

  const fetchAllData = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      const [candidates, jobs, applications, offers, offices, departments, customFields] = await Promise.all([
        axiosAuth.get('/api/integrations/greenhouse/candidates'),
        axiosAuth.get('/api/integrations/greenhouse/jobs'),
        axiosAuth.get('/api/integrations/greenhouse/applications'),
        axiosAuth.get('/api/integrations/greenhouse/offers'),
        axiosAuth.get('/api/integrations/greenhouse/offices'),
        axiosAuth.get('/api/integrations/greenhouse/departments'),
        axiosAuth.get('/api/integrations/greenhouse/custom_fields'),
      ]);
      setAllData({
        candidates: candidates.data,
        jobs: jobs.data,
        applications: applications.data,
        offers: offers.data,
        offices: offices.data,
        departments: departments.data,
        customFields: customFields.data
      });
    } catch (err) {
      console.error('Error preloading data:', err);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
    setExpandedItemId(null);
  }, [activeTab]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleExpanded = (id) => {
    setExpandedItemId((prevId) => (prevId === id ? null : id));
  };

  const renderLinkedInfo = (item) => {
    if (activeTab === 'applications') {
      const candidate = allData.candidates.find(c => c.id === item.candidate_id);
      const job = allData.jobs.find(j => j.id === item.job_id);
      return (
        <div className="mt-4 space-y-2">
          <div><strong>Candidate:</strong> {candidate ? candidate.name : 'Not found'}</div>
          <div><strong>Job:</strong> {job ? job.title : 'Not found'}</div>
        </div>
      );
    }
    return null;
  };

  const renderDetails = (item) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-700">
        {Object.entries(item).map(([key, value]) => (
          <div key={key} className="bg-white p-3 rounded shadow-sm border">
            <div className="font-bold text-gray-800 mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
            <div className="break-words text-gray-600">
              {typeof value === 'object' && value !== null ? (
                <pre className="whitespace-pre-wrap text-xs text-gray-500">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                value?.toString() || '—'
              )}
            </div>
          </div>
        ))}
      </div>
      {renderLinkedInfo(item)}
    </div>
);

  return (
    <div>
      <ClientHeader orgName="Greenhouse Integration Dashboard" user={{}} />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Greenhouse Integration</h1>

      <div className="mb-4">
        <button onClick={() => setActiveTab('field_mapping')} className={`mr-2 px-4 py-2 rounded ${activeTab === 'field_mapping' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Field Mapping
        </button>
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

      <div className="overflow-x-auto">
        {activeTab === 'field_mapping' && (
          <div className="p-4 border rounded bg-white shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Field Mapping</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-700">
              {allData.customFields.map((field) => (
                <div key={field.id || field.name} className="border p-3 rounded">
                  <div className="font-bold text-gray-800 mb-1">{field.name}</div>
                  <div className="text-gray-600">Type: {field.type || '—'}</div>
                  <div className="text-gray-600">Required: {field.required?.toString() || 'false'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <table className="min-w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Name / Title</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !error ? (
              <tr>
                <td colSpan="4" className="text-center p-4">No data found.</td>
              </tr>
            ) : (
              data.map((item) => (
                <React.Fragment key={item.id || item._id || Math.random()}>
                  <tr className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{item.id || item._id}</td>
                    <td className="border px-4 py-2">{item.title || item.name || 'Untitled'}</td>
                    <td className="border px-4 py-2">{item.status || '—'}</td>
                    <td className="border px-4 py-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        onClick={() => toggleExpanded(item.id || item._id)}
                      >
                        {expandedItemId === (item.id || item._id) ? 'Hide' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedItemId === (item.id || item._id) && (
                    <tr>
                      <td colSpan="4" className="bg-gray-50 border px-4 py-4">
                        {renderDetails(item)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default GreenhouseDashboard;
