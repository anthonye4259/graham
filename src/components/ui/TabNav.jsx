import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { id: '/app', icon: 'today-outline', label: 'Today' },
  { id: '/app/scan', icon: 'scan-outline', label: 'Scan' },
  { id: '/app/profile', icon: 'person-outline', label: 'Profile' },
];

export default function TabNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-item ${location.pathname === t.id ? 'active' : ''}`}
          onClick={() => navigate(t.id)}
        >
          <div className="tab-item-icon"><ion-icon name={t.icon}></ion-icon></div>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
