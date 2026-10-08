
import React, { useState } from 'react';
import { ICONS } from '../../App/constants';

interface ProjectCardProps {
  projectId: string;
  projectTitle: string;
  imageUrls?: string[];
  technologies?: string[]; 
  summary?: string;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ projectId, projectTitle, imageUrls, technologies, summary, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasMultipleImages = imageUrls && imageUrls.length > 1;
  const displayImages = imageUrls && imageUrls.length > 0 ? imageUrls : [];

  const hash = projectId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageHue = hash % 360;
  const placeholderImage = `https://picsum.photos/seed/${projectId.replace(/[^a-zA-Z0-9]/g, '')}/400/200?hue=${imageHue}`;

  const currentDisplayImage = displayImages.length > 0 ? displayImages[currentImageIndex] : placeholderImage;

  const FileIcon = ICONS.default;
  const ArrowIcon = ICONS.arrow_right_icon;
  const PrevIcon = ICONS.arrow_left_icon;
  const NextIcon = ICONS.arrow_right_icon;

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div
      onClick={onClick}
      className="bg-[var(--sidebar-background)]/50 backdrop-blur-md rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:shadow-[0_12px_32px_rgba(0,122,204,0.12)] hover:-translate-y-1 hover:bg-[var(--sidebar-background)]/85 border border-[var(--border-color)]/60 hover:border-[var(--text-accent)]/50 group/card flex flex-col"
    >
      <div className="relative w-full h-40 flex-shrink-0 overflow-hidden">
        <img
          src={currentDisplayImage}
          alt={`Cover for ${projectTitle} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => (e.currentTarget.src = placeholderImage)}
        />
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover/card:opacity-100 hover:bg-black/70 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white"
              aria-label="Previous image"
            >
              <PrevIcon size={14} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover/card:opacity-100 hover:bg-black/70 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white"
              aria-label="Next image"
            >
              <NextIcon size={14} />
            </button>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wider">
              {currentImageIndex + 1} / {displayImages.length}
            </div>
          </>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-grow text-left">
        <div className="flex items-center mb-2.5">
          {FileIcon && <FileIcon size={16} className="text-[var(--text-accent)] mr-2 flex-shrink-0" />}
          <h3 className="text-sm sm:text-base font-bold text-[var(--link-foreground)] truncate group-hover/card:text-[var(--link-hover-foreground)] transition-colors duration-200" title={projectTitle}>
            {projectTitle}
          </h3>
        </div>

        {technologies && technologies.length > 0 && (
          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {technologies.map((tech, index) => (
              <span
                key={index}
                className="text-[10px] font-semibold bg-[var(--text-accent)]/10 text-[var(--text-accent)] px-2 py-0.5 rounded-full border border-[var(--text-accent)]/15 tracking-wide"
                title={tech}
              >
                {tech}
              </span>
            ))}
          </div>
        )}
        
        <p className="text-xs text-[var(--text-muted)] mb-4 mt-auto flex-grow leading-relaxed line-clamp-3">
          {summary || 'Click to view project details, architecture, and live links.'}
        </p>
        <div className="flex items-center text-xs sm:text-sm font-bold text-[var(--link-foreground)] group-hover/card:text-[var(--link-hover-foreground)] transition-colors duration-200">
          <span>Open Details</span>
          {ArrowIcon && <ArrowIcon size={14} className="ml-1 group-hover/card:translate-x-1.5 transition-transform duration-200 ease-out" />}
        </div>
      </div>
    </div>
  );
};

// No default export, ProjectCard is a named export.
// export default ProjectCard; 
// Already correctly exported as: export const ProjectCard
