import React from 'react';
import { NavLink } from 'react-router';
import { Sun, Inbox, Map as MapIcon } from 'lucide-react';

export const TABS = [
  { to: '/', label: 'Hoy', Icon: Sun, end: true },
  { to: '/bandeja', label: 'Bandeja', Icon: Inbox, end: false },
  { to: '/mapa', label: 'Mapa', Icon: MapIcon, end: false },
];

/** Barra flotante de abajo con las pestañas. El punto rosa marca dónde estás. */
export const TabBar: React.FC = () => (
  <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-safe pt-8 bg-gradient-to-b from-transparent to-ink to-40% pointer-events-none">
    <nav aria-label="Principal" className="pointer-events-auto mx-auto max-w-[480px] grid grid-cols-3 bg-card border border-edge rounded-[26px] p-1.5 shadow-[0_-12px_30px_rgba(0,0,0,0.5)]">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `relative flex flex-col items-center gap-1 py-2 no-underline ${isActive ? 'text-white' : 'text-text-3'}`}>
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={2.2} />
              <span className={`text-[10px] ${isActive ? 'font-extrabold' : 'font-bold'}`}>{label}</span>
              <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-pink' : 'bg-transparent'}`} />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  </div>
);
