
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminHeader from '../components/AdminHeader';
import axiosWithAuth from '../utils/axiosWithAuth';
import { loadAndApplyTheme, saveAndApplyTheme, getDefaultTheme } from '../utils/themeUtils';

const CMSManagement = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('menu-management');
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    path: '',
    roles: [],
    order: 0,
    isActive: true
  });
  const [editingItem, setEditingItem] = useState(null);
  const [themeColors, setThemeColors] = useState(getDefaultTheme());
  const [activeTheme, setActiveTheme] = useState('default');

  // Available pages with their paths
  const availablePages = [
    { title: 'Admin Dashboard', path: '/admin' },
    { title: 'User Management', path: '/users' },
    { title: 'Plan Management', path: '/plans' },
    { title: 'Environment Variables', path: '/admin/env-vars' },
    { title: 'CMS Management', path: '/admin/cms' },
    { title: 'Workflow Management', path: '/admin/workflows' },
    { title: 'Client Portal', path: '/client' },
    { title: 'Client Workflows', path: '/client/workflows' },
    { title: 'Organization Users', path: '/org/:orgId/users' },
    { title: 'User Profile', path: '/profile' },
    { title: 'Gmail Integration', path: '/client/integrations/gmail' },
    { title: 'Greenhouse Integration', path: '/client/integrations/greenhouse' },
    { title: 'Greenhouse Dashboard', path: '/client/integrations/greenhouse/dashboard' },
    { title: 'Bamboo HR Integration', path: '/client/integrations/bamboo-hr' }
  ];

  // Available roles
  const availableRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'platform_editor', label: 'Platform Editor' },
    { value: 'client_admin', label: 'Client Admin' },
    { value: 'client_editor', label: 'Client Editor' },
    { value: 'client_user', label: 'Client User' }
  ];

  // Default menu structure
  const defaultMenus = [
    {
      id: 'admin-menu',
      name: 'Admin Menu',
      items: [
        { id: 1, name: 'Dashboard', path: '/admin', roles: ['admin'], order: 1, isActive: true },
        { id: 2, name: 'User Management', path: '/users', roles: ['admin'], order: 2, isActive: true },
        { id: 3, name: 'Plan Management', path: '/plans', roles: ['admin'], order: 3, isActive: true },
        { id: 4, name: 'Environment Variables', path: '/admin/env-vars', roles: ['admin'], order: 4, isActive: true },
        { id: 5, name: 'CMS Management', path: '/admin/cms', roles: ['admin'], order: 5, isActive: true }
      ]
    },
    {
      id: 'client-menu',
      name: 'Client Menu',
      items: [
        { id: 1, name: 'Portal Home', path: '/client', roles: ['client_admin', 'client_editor', 'client_user'], order: 1, isActive: true },
        { id: 2, name: 'Workflows', path: '/client/workflows', roles: ['client_admin'], order: 2, isActive: true },
        { id: 3, name: 'User Management', path: '/org/:orgId/users', roles: ['client_admin'], order: 3, isActive: true },
        { id: 4, name: 'Profile', path: '/profile', roles: ['client_admin', 'client_editor', 'client_user'], order: 4, isActive: true }
      ]
    }
  ];

  useEffect(() => {
    fetchMenus();
    
    // Load saved theme when component mounts with retry mechanism
    const initializeTheme = () => {
      try {
        const savedTheme = loadAndApplyTheme();
        if (savedTheme) {
          setThemeColors(savedTheme);
          console.log('CMS: Theme initialized successfully');
        } else {
          setThemeColors(getDefaultTheme());
        }
      } catch (error) {
        console.error('CMS: Failed to initialize theme:', error);
        setThemeColors(getDefaultTheme());
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(initializeTheme, 50);

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

  const fetchMenus = async () => {
    setLoading(true);
    try {
      // For now, use default menus. In a real app, this would fetch from backend
      setMenus(defaultMenus);
      setSelectedMenu(defaultMenus[0]);
      toast.success('Menus loaded successfully');
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      toast.error('Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  const saveMenuItem = () => {
    if (!newMenuItem.name || !newMenuItem.path || newMenuItem.roles.length === 0) {
      toast.error('Please fill in all required fields including at least one role');
      return;
    }

    const updatedMenus = menus.map(menu => {
      if (menu.id === selectedMenu.id) {
        const items = editingItem 
          ? menu.items.map(item => item.id === editingItem.id ? { ...newMenuItem, id: editingItem.id } : item)
          : [...menu.items, { ...newMenuItem, id: Date.now() }];
        return { ...menu, items };
      }
      return menu;
    });

    setMenus(updatedMenus);
    setSelectedMenu(updatedMenus.find(m => m.id === selectedMenu.id));
    setNewMenuItem({ name: '', path: '', roles: [], order: 0, isActive: true });
    setEditingItem(null);
    toast.success(editingItem ? 'Menu item updated' : 'Menu item added');
  };

  const editMenuItem = (item) => {
    setNewMenuItem(item);
    setEditingItem(item);
  };

  const deleteMenuItem = (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    const updatedMenus = menus.map(menu => {
      if (menu.id === selectedMenu.id) {
        return { ...menu, items: menu.items.filter(item => item.id !== itemId) };
      }
      return menu;
    });

    setMenus(updatedMenus);
    setSelectedMenu(updatedMenus.find(m => m.id === selectedMenu.id));
    toast.success('Menu item deleted');
  };

  const toggleItemStatus = (itemId) => {
    const updatedMenus = menus.map(menu => {
      if (menu.id === selectedMenu.id) {
        const items = menu.items.map(item => 
          item.id === itemId ? { ...item, isActive: !item.isActive } : item
        );
        return { ...menu, items };
      }
      return menu;
    });

    setMenus(updatedMenus);
    setSelectedMenu(updatedMenus.find(m => m.id === selectedMenu.id));
    toast.success('Menu item status updated');
  };

  const renderThemeSettings = () => (
    <div style={{ maxWidth: '800px' }}>
      <h3 style={{ marginBottom: '20px' }}>Theme Color Scheme Management</h3>
      
      {/* Theme Presets */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
        <h4 style={{ color: 'white', marginBottom: '15px' }}>Theme Presets</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {[
            { name: 'Default Light', key: 'default', colors: { primary: '#007bff', background: '#ffffff', text: '#212529' } },
            { name: 'Dark Mode', key: 'dark', colors: { primary: '#0d6efd', background: '#121212', text: '#ffffff' } },
            { name: 'Ocean Blue', key: 'ocean', colors: { primary: '#0077be', background: '#f0f8ff', text: '#003d5b' } },
            { name: 'Forest Green', key: 'forest', colors: { primary: '#228b22', background: '#f0fff0', text: '#006400' } },
            { name: 'Sunset Orange', key: 'sunset', colors: { primary: '#ff6347', background: '#fff8dc', text: '#8b4513' } },
            { name: 'Purple Dream', key: 'purple', colors: { primary: '#8a2be2', background: '#f8f0ff', text: '#4b0082' } }
          ].map(preset => (
            <button
              key={preset.key}
              onClick={() => {
                setActiveTheme(preset.key);
                let newThemeColors;
                
                if (preset.key === 'dark') {
                  newThemeColors = {
                    ...themeColors,
                    primary: '#0d6efd',
                    background: '#121212',
                    surface: '#1e1e1e',
                    text: '#ffffff',
                    textSecondary: '#adb5bd',
                    border: '#495057'
                  };
                } else if (preset.key === 'ocean') {
                  newThemeColors = {
                    ...themeColors,
                    primary: '#0077be',
                    secondary: '#5f9ea0',
                    background: '#f0f8ff',
                    surface: '#e6f3ff',
                    text: '#003d5b',
                    accent: '#00bfff'
                  };
                } else if (preset.key === 'forest') {
                  newThemeColors = {
                    ...themeColors,
                    primary: '#228b22',
                    secondary: '#32cd32',
                    background: '#f0fff0',
                    surface: '#e6ffe6',
                    text: '#006400',
                    accent: '#90ee90'
                  };
                } else if (preset.key === 'sunset') {
                  newThemeColors = {
                    ...themeColors,
                    primary: '#ff6347',
                    secondary: '#ffa500',
                    background: '#fff8dc',
                    surface: '#ffe4b5',
                    text: '#8b4513',
                    accent: '#ff7f50'
                  };
                } else if (preset.key === 'purple') {
                  newThemeColors = {
                    ...themeColors,
                    primary: '#8a2be2',
                    secondary: '#9370db',
                    background: '#f8f0ff',
                    surface: '#e6d3ff',
                    text: '#4b0082',
                    accent: '#da70d6'
                  };
                } else {
                  newThemeColors = {
                    primary: '#007bff',
                    secondary: '#6c757d',
                    success: '#28a745',
                    danger: '#dc3545',
                    warning: '#ffc107',
                    info: '#17a2b8',
                    light: '#f8f9fa',
                    dark: '#343a40',
                    background: '#ffffff',
                    surface: '#f8f9fa',
                    text: '#212529',
                    textSecondary: '#6c757d',
                    border: '#dee2e6',
                    accent: '#17a2b8'
                  };
                }
                
                setThemeColors(newThemeColors);
                saveAndApplyTheme(newThemeColors);
                
                // Dispatch theme change event
                window.dispatchEvent(new CustomEvent('themeChanged', {
                  detail: { themeColors: newThemeColors }
                }));
                
                toast.success(`Applied ${preset.name} theme`);
              }}
              style={{
                padding: '15px',
                background: activeTheme === preset.key ? preset.colors.primary : '#333',
                color: activeTheme === preset.key ? 'white' : '#ccc',
                border: `2px solid ${activeTheme === preset.key ? preset.colors.primary : '#555'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{preset.name}</div>
              <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                <div style={{ width: '12px', height: '12px', background: preset.colors.primary, borderRadius: '50%' }}></div>
                <div style={{ width: '12px', height: '12px', background: preset.colors.background, border: '1px solid #ccc', borderRadius: '50%' }}></div>
                <div style={{ width: '12px', height: '12px', background: preset.colors.text, borderRadius: '50%' }}></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Editor */}
      <div style={{ padding: '20px', background: '#1e1e1e', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ color: 'white', marginBottom: '20px' }}>Custom Color Editor</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {Object.entries(themeColors).map(([colorKey, colorValue]) => (
            <div key={colorKey} style={{ background: '#2a2a2a', padding: '15px', borderRadius: '6px' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {colorKey.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={colorValue}
                  onChange={(e) => setThemeColors({ ...themeColors, [colorKey]: e.target.value })}
                  style={{ width: '50px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={colorValue}
                  onChange={(e) => setThemeColors({ ...themeColors, [colorKey]: e.target.value })}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white' }}
                />
              </div>
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

      {/* Live Preview */}
      <div style={{ padding: '20px', background: themeColors.background, borderRadius: '8px', border: `2px solid ${themeColors.border}` }}>
        <h4 style={{ color: themeColors.text, marginBottom: '15px' }}>Live Preview</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          <button style={{ background: themeColors.primary, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>Primary Button</button>
          <button style={{ background: themeColors.secondary, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>Secondary Button</button>
          <button style={{ background: themeColors.success, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>Success Button</button>
          <button style={{ background: themeColors.danger, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>Danger Button</button>
          <button style={{ background: themeColors.warning, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>Warning Button</button>
        </div>
        <div style={{ padding: '15px', background: themeColors.surface, borderRadius: '6px', border: `1px solid ${themeColors.border}` }}>
          <h5 style={{ color: themeColors.text, margin: '0 0 10px 0' }}>Card Example</h5>
          <p style={{ color: themeColors.textSecondary, margin: '0 0 10px 0' }}>This is how text will look with your current theme settings.</p>
          <a href="#" style={{ color: themeColors.accent, textDecoration: 'none' }}>Accent Link</a>
        </div>
      </div>
    </div>
  );

  const renderMenuManagement = () => (
    <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
      {/* Menu Selection */}
      <div style={{ width: '200px', background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
        <h4>Select Menu</h4>
        {menus.map(menu => (
          <button
            key={menu.id}
            onClick={() => setSelectedMenu(menu)}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              margin: '5px 0',
              background: selectedMenu?.id === menu.id ? '#007bff' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {menu.name}
          </button>
        ))}
      </div>

      {/* Menu Items Management */}
      <div style={{ flex: 1, background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
        {selectedMenu && (
          <>
            <h4>Managing: {selectedMenu.name}</h4>
            
            {/* Add/Edit Form */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '4px' }}>
              <h5>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Menu Name"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: 'none' }}
                />
                <select
                  value={newMenuItem.path}
                  onChange={(e) => {
                    const selectedPage = availablePages.find(page => page.path === e.target.value);
                    setNewMenuItem({ 
                      ...newMenuItem, 
                      path: e.target.value,
                      name: newMenuItem.name || selectedPage?.title || ''
                    });
                  }}
                  style={{ padding: '8px', borderRadius: '4px', border: 'none' }}
                >
                  <option value="">Select Page</option>
                  {availablePages.map(page => (
                    <option key={page.path} value={page.path}>
                      {page.title} ({page.path})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Order"
                  value={newMenuItem.order}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, order: parseInt(e.target.value) })}
                  style={{ padding: '8px', borderRadius: '4px', border: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Custom Path (optional)"
                  value={newMenuItem.path}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, path: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: 'none' }}
                />
              </div>
              
              {/* Multi-role selection */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ color: 'white', marginBottom: '5px', display: 'block' }}>Select Roles:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '10px', background: '#333', borderRadius: '4px' }}>
                  {availableRoles.map(role => (
                    <label key={role.value} style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={newMenuItem.roles.includes(role.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewMenuItem({ 
                              ...newMenuItem, 
                              roles: [...newMenuItem.roles, role.value] 
                            });
                          } else {
                            setNewMenuItem({ 
                              ...newMenuItem, 
                              roles: newMenuItem.roles.filter(r => r !== role.value) 
                            });
                          }
                        }}
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={saveMenuItem}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
                {editingItem && (
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setNewMenuItem({ name: '', path: '', roles: [], order: 0, isActive: true });
                    }}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Menu Items List */}
            <div>
              <h5>Current Menu Items</h5>
              {selectedMenu.items.length === 0 ? (
                <p>No menu items found.</p>
              ) : (
                <table style={{ width: '100%', color: 'white' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Path</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Roles</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Order</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMenu.items.sort((a, b) => a.order - b.order).map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '10px' }}>{item.name}</td>
                        <td style={{ padding: '10px' }}>{item.path}</td>
                        <td style={{ padding: '10px' }}>
                          {item.roles ? item.roles.join(', ') : item.role || 'No roles'}
                        </td>
                        <td style={{ padding: '10px' }}>{item.order}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ color: item.isActive ? 'green' : 'red' }}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <button
                            onClick={() => editMenuItem(item)}
                            style={{
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: '5px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleItemStatus(item.id)}
                            style={{
                              background: item.isActive ? '#ffc107' : '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: '5px'
                            }}
                          >
                            {item.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => deleteMenuItem(item.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'menu-management':
        return renderMenuManagement();
      case 'theme-settings':
        return renderThemeSettings();
      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  if (loading) return <div>Loading CMS Management...</div>;

  return (
    <div>
      <AdminHeader />
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          background: '#2c2c2c',
          padding: '20px',
          borderRight: '1px solid #444'
        }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>CMS Management</h3>
          <nav>
            <button
              onClick={() => setActiveSection('menu-management')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                background: activeSection === 'menu-management' ? '#007bff' : 'transparent',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              📋 Menu Management
            </button>
            <button
              onClick={() => setActiveSection('theme-settings')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                background: activeSection === 'theme-settings' ? '#007bff' : 'transparent',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              🎨 Theme Settings
            </button>
            <button
              onClick={() => toast.info('Page Management - Coming soon!')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                background: 'transparent',
                color: '#888',
                border: '1px solid #444',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              📄 Page Management
            </button>
            <button
              onClick={() => toast.info('Content Management - Coming soon!')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                background: 'transparent',
                color: '#888',
                border: '1px solid #444',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              📝 Content Management
            </button>
            <button
              onClick={() => toast.info('Settings - Coming soon!')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                background: 'transparent',
                color: '#888',
                border: '1px solid #444',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '20px' }}>
          {renderContent()}
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CMSManagement;
