import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminHeader from '../components/AdminHeader';
import axiosWithAuth from '../utils/axiosWithAuth';
import { loadAndApplyTheme, saveAndApplyTheme, getDefaultTheme } from '../utils/themeUtils';

function CMSManagement() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('settings');
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [menuButtons, setMenuButtons] = useState([]);
  const [newButtonText, setNewButtonText] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [themeColors, setThemeColors] = useState(getDefaultTheme());

  // Available pages for dropdown
  const availablePages = [
    { title: 'Admin Dashboard', path: '/admin' },
    { title: 'User Management', path: '/users' },
    { title: 'Plan Management', path: '/plans' },
    { title: 'Environment Variables', path: '/admin/env-vars' },
    { title: 'CMS Management', path: '/admin/cms' },
    { title: 'Client Portal', path: '/client' },
    { title: 'User Profile', path: '/profile' },
    { title: 'Workflow Management', path: '/client/workflows' },
    { title: 'Organization Users', path: '/org/:orgId/users' }
  ];

  // Available roles
  const availableRoles = ['admin', 'client', 'user', 'manager'];

  const fetchMenus = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      const response = await axiosAuth.get('/api/admin/menus');
      setMenus(response.data || []);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      toast.error('Failed to load menus');
    }
  };

  const fetchMenuButtons = async (menuName) => {
    if (!menuName) return;
    try {
      const axiosAuth = axiosWithAuth();
      const response = await axiosAuth.get(`/api/admin/menus/${menuName}/buttons`);
      setMenuButtons(response.data || []);
    } catch (error) {
      console.error('Failed to fetch menu buttons:', error);
      setMenuButtons([]);
    }
  };

  const createMenu = async (menuName) => {
    try {
      const axiosAuth = axiosWithAuth();
      await axiosAuth.post('/api/admin/menus', { name: menuName, buttons: [] });
      toast.success('Menu created successfully');
      fetchMenus();
    } catch (error) {
      console.error('Failed to create menu:', error);
      toast.error('Failed to create menu');
    }
  };

  const addButtonToMenu = async () => {
    if (!selectedMenu || !newButtonText || !selectedPage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const axiosAuth = axiosWithAuth();
      const selectedPageData = availablePages.find(page => page.path === selectedPage);
      await axiosAuth.post(`/api/admin/menus/${selectedMenu}/buttons`, {
        text: newButtonText,
        path: selectedPage,
        title: selectedPageData?.title || newButtonText,
        roles: selectedRoles
      });
      toast.success('Button added successfully');
      setNewButtonText('');
      setSelectedPage('');
      setSelectedRoles([]);
      fetchMenuButtons(selectedMenu);
    } catch (error) {
      console.error('Failed to add button:', error);
      toast.error('Failed to add button');
    }
  };

  const removeButtonFromMenu = async (buttonId) => {
    try {
      const axiosAuth = axiosWithAuth();
      await axiosAuth.delete(`/api/admin/menus/${selectedMenu}/buttons/${buttonId}`);
      toast.success('Button removed successfully');
      fetchMenuButtons(selectedMenu);
    } catch (error) {
      console.error('Failed to remove button:', error);
      toast.error('Failed to remove button');
    }
  };

  useEffect(() => {
    fetchMenus();

    // Initialize theme only once
    const savedTheme = loadAndApplyTheme();
    if (savedTheme) {
      setThemeColors(savedTheme);
    }

    // Listen for theme changes from other components
    const handleGlobalThemeChange = (event) => {
      if (event.detail && event.detail.themeColors) {
        setThemeColors(event.detail.themeColors);
      }
    };

    window.addEventListener('themeChanged', handleGlobalThemeChange);
    window.addEventListener('themeApplied', handleGlobalThemeChange);

    return () => {
      window.removeEventListener('themeChanged', handleGlobalThemeChange);
      window.removeEventListener('themeApplied', handleGlobalThemeChange);
    };
  }, []);

  useEffect(() => {
    if (selectedMenu) {
      fetchMenuButtons(selectedMenu);
    }
  }, [selectedMenu]);

  const handleColorChange = (colorKey, colorValue) => {
    setThemeColors(prev => ({
      ...prev,
      [colorKey]: colorValue
    }));
  };

  return (
    <div>
      <AdminHeader />
      <div style={{ display: 'flex', maxWidth: '1200px', margin: 'auto' }}>
        {/* Left Sidebar */}
        <div style={{ 
          width: '250px', 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRight: '1px solid #dee2e6',
          minHeight: '600px'
        }}>
          <h4>CMS Management</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <button
                onClick={() => setCurrentView('settings')}
                style={{
                  background: currentView === 'settings' ? '#007bff' : 'transparent',
                  color: currentView === 'settings' ? 'white' : '#333',
                  border: 'none',
                  padding: '10px 15px',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '5px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Theme Settings
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('menus')}
                style={{
                  background: currentView === 'menus' ? '#007bff' : 'transparent',
                  color: currentView === 'menus' ? 'white' : '#333',
                  border: 'none',
                  padding: '10px 15px',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '5px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Menu Management
              </button>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '20px' }}>
          {currentView === 'settings' && (
            <div>
              <h3>Theme Color Settings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                {Object.entries(themeColors).map(([colorKey, colorValue]) => (
                  <div key={colorKey} style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => handleColorChange(colorKey, e.target.value)}
                      style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <div style={{ marginTop: '8px', padding: '8px', background: colorValue, borderRadius: '4px', textAlign: 'center', color: colorKey.includes('text') || colorKey.includes('dark') ? 'white' : 'black', fontSize: '12px' }}>
                      Preview
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const success = saveAndApplyTheme(themeColors);
                    if (success) {
                      // Dispatch theme change event to notify other components
                      window.dispatchEvent(new CustomEvent('themeChanged', {
                        detail: { themeColors }
                      }));
                      toast.success('Theme applied and saved!');
                    } else {
                      toast.error('Failed to save theme');
                    }
                  }}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Apply & Save Theme
                </button>
                <button
                  onClick={() => {
                    const savedTheme = loadAndApplyTheme();
                    if (savedTheme) {
                      setThemeColors(savedTheme);
                      // Dispatch theme change event
                      window.dispatchEvent(new CustomEvent('themeChanged', {
                        detail: { themeColors: savedTheme }
                      }));
                      toast.success('Theme loaded from saved settings');
                    } else {
                      toast.info('No saved theme found');
                    }
                  }}
                  style={{
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Load Saved Theme
                </button>
                <button
                  onClick={() => {
                    const defaultTheme = getDefaultTheme();
                    setThemeColors(defaultTheme);
                    saveAndApplyTheme(defaultTheme);
                    // Dispatch theme change event
                    window.dispatchEvent(new CustomEvent('themeChanged', {
                      detail: { themeColors: defaultTheme }
                    }));
                    toast.info('Reset to default colors');
                  }}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Reset to Default
                </button>
              </div>
            </div>
          )}

          {currentView === 'menus' && (
            <div>
              <h3>Menu Management</h3>

              <div style={{ marginBottom: '20px' }}>
                <h4>Select Menu to Manage</h4>
                <select
                  value={selectedMenu}
                  onChange={(e) => setSelectedMenu(e.target.value)}
                  style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">Select a menu...</option>
                  {menus.map((menu) => (
                    <option key={menu.name} value={menu.name}>
                      {menu.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const menuName = prompt('Enter menu name:');
                    if (menuName) createMenu(menuName);
                  }}
                  style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Create New Menu
                </button>
              </div>

              {selectedMenu && (
                <div>
                  <h4>Manage Buttons for "{selectedMenu}"</h4>

                  <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <h5>Add New Button</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Button Text"
                        value={newButtonText}
                        onChange={(e) => setNewButtonText(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      <select
                        value={selectedPage}
                        onChange={(e) => setSelectedPage(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="">Select Page...</option>
                        {availablePages.map((page) => (
                          <option key={page.path} value={page.path}>
                            {page.title} ({page.path})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Select Roles (multiple):
                      </label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {availableRoles.map((role) => (
                          <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRoles([...selectedRoles, role]);
                                } else {
                                  setSelectedRoles(selectedRoles.filter(r => r !== role));
                                }
                              }}
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={addButtonToMenu}
                      style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Add Button
                    </button>
                  </div>

                  <h5>Current Buttons</h5>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {menuButtons.map((button, index) => (
                      <div key={index} style={{ padding: '10px', background: '#e9ecef', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{button.text}</strong> → {button.path}
                          <br />
                          <small>Roles: {button.roles ? button.roles.join(', ') : 'None'}</small>
                        </div>
                        <button
                          onClick={() => removeButtonFromMenu(button._id || index)}
                          style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default CMSManagement;