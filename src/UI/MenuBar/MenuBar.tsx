
import React from 'react';
import { AppMenuItem } from '../../App/types'; 

interface MenuBarProps {
  menuItems: { name: string; subItems?: AppMenuItem[] }[]; 
  activeMenu: string | null;
  toggleMenu: (menuName: string) => void;
  renderSubItems: (items: AppMenuItem[], level?: number) => JSX.Element | null;
}


const MenuBar: React.FC<MenuBarProps> = ({ menuItems, activeMenu, toggleMenu, renderSubItems }) => {
  return (
    <>
      {menuItems.map((menu) => (
         <div key={menu.name} className="relative">
          <button
            onClick={() => toggleMenu(menu.name)}
            onMouseEnter={() => {
              if (activeMenu && activeMenu !== menu.name) toggleMenu(menu.name);
            }}
            className={`menubar-glass-trigger px-2.5 py-1 rounded-lg focus:outline-none transition-all duration-300 ease-out text-xs text-[var(--menubar-foreground)]
              ${activeMenu === menu.name ? 'bg-[var(--titlebar-menu-active-background)]' : 'hover:bg-[var(--menubar-hover-background)]'}`}
            title={menu.name}
            aria-haspopup="menu"
            aria-expanded={activeMenu === menu.name}
          >
            {menu.name}
          </button>
          {menu.subItems && activeMenu === menu.name && renderSubItems(menu.subItems)}
        </div>
      ))}
    </>
  );
};

export default MenuBar;
