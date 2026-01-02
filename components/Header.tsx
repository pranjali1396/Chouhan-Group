
import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, UserCircleIcon, CogIcon, ArrowLeftOnRectangleIcon, BellIcon } from './Icons';
import SearchResults from './SearchResults';
import type { Lead, User } from '../types';
import { api } from '../services/api';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchResults: Lead[];
  leads: Lead[];
  users: User[];
  currentUser: User;
  userStatus?: 'Online' | 'Away' | 'Offline';
  onLogout: () => void;
  onRefresh: () => void;
  onToggleSidebar: () => void;
  onResultClick: (lead: Lead) => void;
  onNavigate: (view: string) => void;
}

interface Notification {
  id: string;
  type: 'new_lead' | 'lead_assigned';
  message: string;
  leadId?: string;
  leadData?: {
    customerName?: string;
    mobile?: string;
    email?: string;
    interestedProject?: string;
    source?: string;
    status?: string;
  };
  targetRole?: string;
  targetUserId?: string;
  createdAt: string;
  isRead: boolean;
}

const NotificationsDropdown: React.FC<{ currentUser: User; onNavigate: (view: string) => void; onResultClick: (leadId: string) => void }> = ({ currentUser, onNavigate, onResultClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const lastCheckedRef = useRef<string>(new Date().toISOString());
  const hasLoadedInitialRef = useRef<boolean>(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      if (!hasLoadedInitialRef.current) {
        const allNotifications = await api.getNotifications(currentUser.id, currentUser.role);
        if (allNotifications.length > 0) {
          const unreadNotifications = allNotifications.filter(n => !n.isRead);
          setNotifications(unreadNotifications.slice(0, 20));
        }
        hasLoadedInitialRef.current = true;
        lastCheckedRef.current = new Date().toISOString();
        return;
      }

      const newNotifications = await api.getNotifications(currentUser.id, currentUser.role, lastCheckedRef.current);
      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const filtered = prev.filter(n => !n.isRead);
          const combined = [...newNotifications, ...filtered];
          const unique = Array.from(new Map(combined.map(n => [n.id, n])).values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return unique.slice(0, 20);
        });
        lastCheckedRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    hasLoadedInitialRef.current = false;
    lastCheckedRef.current = new Date().toISOString();
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead && !removingIds.has(n.id)).length;
    setUnreadCount(unread);
  }, [notifications, removingIds]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await api.markNotificationRead(notification.id);
        setRemovingIds(prev => new Set(prev).add(notification.id));
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
          setRemovingIds(prev => {
            const next = new Set(prev);
            next.delete(notification.id);
            return next;
          });
        }, 300);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    } else {
      setRemovingIds(prev => new Set(prev).add(notification.id));
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(notification.id);
          return next;
        });
      }, 300);
    }

    if (notification.leadId) {
      onNavigate('Leads');
      setTimeout(() => onResultClick(notification.leadId!), 100);
    } else {
      onNavigate('Leads');
    }
    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    for (const notif of unreadNotifications) {
      try {
        await api.markNotificationRead(notif.id);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    const unreadIds = new Set(unreadNotifications.map(n => n.id));
    setRemovingIds(prev => new Set([...prev, ...unreadIds]));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => !unreadIds.has(n.id)));
      setRemovingIds(prev => {
        const next = new Set(prev);
        unreadIds.forEach(id => next.delete(id));
        return next;
      });
    }, 300);
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await api.deleteNotification(notificationId);
      setRemovingIds(prev => new Set(prev).add(notificationId));
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(notificationId);
          return next;
        });
      }, 300);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <BellIcon className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in fade-in zoom-in duration-200 origin-top-right max-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-primary-focus font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative group w-full transition-all duration-300 ${removingIds.has(notification.id)
                      ? 'opacity-0 translate-x-full max-h-0 overflow-hidden'
                      : 'opacity-100 translate-x-0'
                      }`}
                  >
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-1 ${notification.type === 'new_lead' ? 'text-green-500' : 'text-blue-500'
                          }`}>
                          {notification.type === 'new_lead' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                            {notification.message || (notification.type === 'new_lead' ? `New lead from ${notification.leadData?.customerName || 'Unknown'}` : 'Lead Assigned')}
                          </p>
                          {notification.leadData?.mobile && (
                            <p className="text-xs text-gray-500 mt-1">
                              📱 {notification.leadData.mobile}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          {!notification.isRead && (
                            <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete notification"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const UserMenu: React.FC<{ user: User, status?: string, onLogout: () => void, onNavigate: (view: string) => void }> = ({ user, status = 'Offline', onLogout, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Status indicators
  const statusColors = {
    'Online': 'bg-emerald-500',
    'Away': 'bg-amber-500',
    'Offline': 'bg-rose-500'
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSettingsClick = () => {
    onNavigate('Settings');
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    if (user.role === 'Admin') {
      onNavigate('Settings');
    } else {
      alert("Profile editing is restricted for salespersons. Please contact admin.");
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-1.5 p-1 rounded-full hover:bg-base-300 transition-colors focus:outline-none">
        <div className="relative">
          <img
            src={user.avatarUrl}
            alt={`${user.name}'s Avatar`}
            className="w-7 h-7 rounded-full border border-gray-200"
          />
          <span className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full border-2 border-white ${statusColors[status as keyof typeof statusColors] || 'bg-gray-400'}`}></span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-semibold text-base-content">{user.name}</p>
          <p className="text-[10px] text-muted-content font-bold uppercase tracking-tighter opacity-70">{status}</p>
        </div>
        <svg className={`hidden md:block w-3.5 h-3.5 text-muted-content transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="p-2">
            <div className="flex items-center p-3 mb-2 bg-base-200 rounded-xl">
              <div className="relative">
                <img src={user.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                <span className={`absolute bottom-0.5 right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-white ${statusColors[status as keyof typeof statusColors] || 'bg-gray-400'}`}></span>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-black text-slate-800 truncate">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-400'}`}></div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{status}</p>
                </div>
              </div>
            </div>
            <button onClick={handleProfileClick} className="flex items-center w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              <UserCircleIcon className="w-5 h-5 mr-3 text-slate-400" />
              <span>My Profile</span>
            </button>
            {user.role === 'Admin' && (
              <button onClick={handleSettingsClick} className="flex items-center w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                <CogIcon className="w-5 h-5 mr-3 text-slate-400" />
                <span>Team Settings</span>
              </button>
            )}
            <div className="my-2 h-px bg-slate-100" />
            <button onClick={(e) => { e.preventDefault(); onLogout(); }} className="flex items-center w-full text-left px-3 py-2.5 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange, searchResults, leads, users, currentUser, userStatus, onLogout, onRefresh, onToggleSidebar, onResultClick, onNavigate }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearchTerm, onSearchChange]);

  useEffect(() => {
    if (searchTerm !== localSearchTerm) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);

  return (
    <header className="flex items-center justify-between h-12 md:h-16 px-3 md:px-6 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex-shrink-0 sticky top-0 z-30 shadow-sm animate-fade-in">
      <div className="flex items-center flex-1">
        <button onClick={onToggleSidebar} className="md:hidden mr-2 p-1.5 text-slate-500 rounded-lg hover:bg-slate-100 transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="relative w-full md:w-[450px] group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
          </span>
          <input
            type="text"
            placeholder="Search leads..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="w-full py-1.5 md:py-2.5 pl-9 md:pl-11 pr-4 text-[11px] md:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all duration-300 placeholder-slate-400 font-medium"
          />
          {searchTerm && <SearchResults results={searchResults} users={users} onResultClick={onResultClick} />}
        </div>
      </div>
      <div className="flex items-center space-x-3 md:space-x-4 ml-4">
        <button
          onClick={onRefresh}
          className="p-2.5 text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95 hidden sm:flex items-center justify-center border border-slate-200 shadow-sm"
          title="Refresh Dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
        <NotificationsDropdown
          currentUser={currentUser}
          onNavigate={onNavigate}
          onResultClick={(leadId) => {
            const lead = [...searchResults, ...leads].find(l => l.id === leadId);
            if (lead) {
              onResultClick(lead);
            } else {
              onNavigate('Leads');
            }
          }}
        />
        <UserMenu user={currentUser} status={userStatus} onLogout={onLogout} onNavigate={onNavigate} />
      </div>
    </header>
  );
};

export default Header;