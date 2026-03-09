
import React from 'react';
import { PageId } from '../types';

interface NavbarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const links: { id: PageId; label: string; icon: string }[] = [
    { id: 'home', label: 'Utama', icon: 'fa-house' },
    { id: 'guaman', label: 'Guaman', icon: 'fa-gavel' },
    { id: 'pjs', label: 'PJS', icon: 'fa-stamp' },
    { id: 'kewangan', label: 'Kewangan', icon: 'fa-wallet' },
    { id: 'inventory', label: 'Servis', icon: 'fa-briefcase' },
    { id: 'invoice', label: 'Jana Resit', icon: 'fa-receipt' },
  ];

  return (
    <nav className="bg-[#1c1c1c] border-b border-[#2a2a2a] p-1.5 flex overflow-x-auto no-scrollbar">
      <div className="flex mx-auto gap-1.5">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => onPageChange(link.id)}
            className={`
              whitespace-nowrap px-5 py-3 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 rounded-lg
              ${currentPage === link.id 
                ? 'bg-[#FFD700] text-black shadow-lg shadow-[#FFD700]/10' 
                : 'text-[#FFD700] hover:bg-white/5 border border-transparent hover:border-white/10'
              }
            `}
          >
            <i className={`fas ${link.icon} text-sm`}></i>
            <span className="hidden sm:inline">{link.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
