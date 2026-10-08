
import React, { useState } from 'react';
import { ICONS } from '../../App/constants';
import { ActivityBarSelection, ActivityBarItemConfig, FeatureStatus } from '../../App/types'; 
import { playSound } from '../../Utils/audioUtils';
import { HardHat, AlertTriangle } from 'lucide-react'; // Added AlertTriangle


interface ActivityBarProps {
  items: ActivityBarItemConfig[];
  onReorder: (draggedItemId: string, targetItemId: string) => void;
  activeViewId?: ActivityBarSelection;
  onOpenSettingsEditor: () => void; 
  className?: string; 
  // 'horizontal' renders a bottom tab bar for the mobile layout.
  orientation?: 'vertical' | 'horizontal';
}

const ActivityBar: React.FC<ActivityBarProps> = ({ 
  items,
  onReorder,
  activeViewId,
  onOpenSettingsEditor, 
  className,
  orientation = 'vertical',
}) => {
  const isHorizontal = orientation === 'horizontal';
  const SettingsIcon = ICONS.settings_icon;
  // Changed to AlertTriangle for a more direct warning indication
  const MaintenanceIcon = ICONS.AlertTriangle || AlertTriangle; 
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>, targetItemId: string) => {
    e.preventDefault();
    if (draggedItemId && targetItemId !== draggedItemId) {
      setDragOverItemId(targetItemId);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>, targetItemId: string) => {
    e.preventDefault();
    if (draggedItemId && targetItemId !== draggedItemId) {
      setDragOverItemId(targetItemId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItemId(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetItemId: string) => {
    e.preventDefault();
    if (draggedItemId && targetItemId !== draggedItemId) {
      onReorder(draggedItemId, targetItemId);
    }
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };
  
  const handleActionClick = (action: () => void, status?: FeatureStatus) => {
    if (status === 'active') { // Only play sound if active
      playSound('ui-click');
    }
    action(); // Action now handles notification for maintenance
  };

  const handleSettingsIconClick = () => {
    playSound('ui-click');
    onOpenSettingsEditor(); 
  };

  return (
    <div
      className={isHorizontal
        ? `h-14 w-full bg-[var(--activitybar-background)] border-t border-[var(--titlebar-border)] flex flex-row items-center px-1 flex-shrink-0 ${className || ''}`
        : `w-12 bg-[var(--activitybar-background)] h-full flex flex-col justify-between items-center py-3 shadow-md flex-shrink-0 ${className || ''}`}
      role={isHorizontal ? 'tablist' : undefined}
      aria-orientation={isHorizontal ? 'horizontal' : undefined}
    >
      <div className={isHorizontal ? 'flex flex-row flex-1 items-center justify-around overflow-x-auto no-scrollbar' : 'flex flex-col space-y-1 w-full items-center'}>
        {items.map((item) => {
          const isFeatureActive = item.status === 'active';
          const isActiveTab = activeViewId === item.viewId && isFeatureActive; // Tab is active only if feature is active
          const isBeingDragged = draggedItemId === item.id;
          const isDragOverTarget = dragOverItemId === item.id && !isBeingDragged;
          const isDisabledByMaintenance = !isFeatureActive;

          let buttonClasses = `p-2.5 rounded focus:outline-none transition-colors duration-150 ease-in-out relative ${isHorizontal ? 'w-11 h-11 flex-shrink-0' : 'w-10 h-10'} flex items-center justify-center`;
          
          if (isDisabledByMaintenance) {
            buttonClasses += ` text-[var(--activitybar-inactive-foreground)] opacity-50 cursor-not-allowed`;
          } else if (isActiveTab) {
            buttonClasses += ` text-[var(--activitybar-foreground)] bg-[var(--activitybar-active-background)]`;
          } else {
            buttonClasses += ` text-[var(--activitybar-inactive-foreground)] hover:text-[var(--activitybar-foreground)] hover:bg-[var(--activitybar-hover-background)] focus:bg-[var(--activitybar-hover-background)]`;
          }

          if (isBeingDragged) buttonClasses += ' opacity-50 border-2 border-dashed border-[var(--focus-border)]';
          if (isDragOverTarget && isFeatureActive) buttonClasses += ' border-t-2 border-[var(--focus-border)]';


          return (
            <button
              key={item.id}
              draggable={isFeatureActive && !isHorizontal} // Only draggable if active (no drag on touch tab bar)
              onDragStart={(e) => isFeatureActive && handleDragStart(e, item.id)}
              onDragOver={(e) => isFeatureActive && handleDragOver(e, item.id)}
              onDragEnter={(e) => isFeatureActive && handleDragEnter(e, item.id)}
              onDragLeave={(e) => isFeatureActive && handleDragLeave(e)}
              onDrop={(e) => isFeatureActive && handleDrop(e, item.id)}
              onDragEnd={() => isFeatureActive && handleDragEnd()}
              onClick={() => handleActionClick(item.action, item.status)}
              className={buttonClasses}
              title={isDisabledByMaintenance ? `${item.label} (Under Maintenance)` : item.label}
              aria-label={isDisabledByMaintenance ? `${item.label} (Under Maintenance)` : item.label}
              aria-pressed={isActiveTab}
              aria-current={isActiveTab ? "page" : undefined}
              disabled={isDisabledByMaintenance && !isBeingDragged} // Disable if in maintenance (unless being dragged for reorder)
            >
              {isActiveTab && !isDragOverTarget && ( 
                <span 
                  className={isHorizontal
                    ? "absolute top-0 left-1/2 transform -translate-x-1/2 h-0.5 w-6 bg-[var(--activitybar-active-border)] rounded-b-sm"
                    : "absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-[var(--activitybar-active-border)] rounded-r-sm"}
                  aria-hidden="true"
                ></span>
              )}
              <item.icon size={22} />
              {isDisabledByMaintenance && (
                <MaintenanceIcon size={10} className="maintenance-icon-badge" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className={isHorizontal ? 'flex flex-row flex-shrink-0' : 'flex flex-col space-y-1'}>
        {SettingsIcon && (
          <button
            onClick={handleSettingsIconClick} 
            className="p-2.5 rounded text-[var(--activitybar-inactive-foreground)] hover:text-[var(--activitybar-foreground)] hover:bg-[var(--activitybar-hover-background)] focus:bg-[var(--activitybar-hover-background)] focus:outline-none transition-colors duration-150 ease-in-out w-10 h-10 flex items-center justify-center"
            title="Manage Settings" 
            aria-label="Manage settings"
          >
            <SettingsIcon size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityBar;
