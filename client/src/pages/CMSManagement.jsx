
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminHeader from '../components/AdminHeader';
import axiosWithAuth from '../utils/axiosWithAuth';

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
