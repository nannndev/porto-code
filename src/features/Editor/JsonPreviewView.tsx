
import React from 'react';
import { PortfolioData, EducationEntry, WorkExperienceEntry, Position, ProjectDetail } from '../../App/types';
import { ICONS } from '../../App/constants';
import ImageLightbox from '../../UI/ImageLightbox';
import { CheckCircle2, MessageCircle, Send, TrendingUp, UserCircle2 } from 'lucide-react';

interface JsonPreviewViewProps {
  jsonData: any;
  fileId: string;
  portfolioData: PortfolioData;
}

// Converts a local Indonesian number (08xx…) to international form for display and WhatsApp.
const toInternationalPhone = (phone: string): { display: string; digits: string } => {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  const local = digits.startsWith('62') ? digits.slice(2) : digits;
  const grouped = local.replace(/^(\d{3})(\d{4})(\d+)$/, '$1-$2-$3');
  return { display: digits.startsWith('62') ? `+62 ${grouped}` : `+${digits}`, digits };
};

const ContactComposer: React.FC<{ email?: string; whatsappDigits?: string }> = ({ email, whatsappDigits }) => {
  const [name, setName] = React.useState('');
  const [message, setMessage] = React.useState('');
  const body = `Hi Nandang,\n\n${message.trim()}${name.trim() ? `\n\n— ${name.trim()}` : ''}`;
  const canSend = message.trim().length > 0;
  const subject = `Portfolio inquiry${name.trim() ? ` from ${name.trim()}` : ''}`;
  const inputClass = 'w-full p-2 bg-[var(--modal-input-background)] text-[var(--modal-foreground)] border border-[var(--modal-input-border)] rounded-lg focus:outline-none focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-border)] text-xs sm:text-sm placeholder-[var(--text-muted)]';
  const buttonClass = 'inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors duration-200';

  return (
    <div className="sm:col-span-2 p-5 rounded-xl border border-[var(--border-color)]/60 bg-[var(--sidebar-background)]/30 backdrop-blur-sm">
      <div className="flex items-center text-[var(--text-accent)] mb-3">
        <Send size={16} className="mr-2" />
        <span className="text-xs font-bold uppercase tracking-wider">Send a Quick Message</span>
      </div>
      <div className="grid gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)" aria-label="Your name" className={inputClass} />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi! I'd like to talk about…" aria-label="Message" rows={4} className={`${inputClass} resize-y`} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {email && (
          <a
            href={canSend ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : undefined}
            aria-disabled={!canSend}
            className={`${buttonClass} bg-[var(--modal-button-background)] text-[var(--modal-button-foreground)] hover:bg-[var(--modal-button-hover-background)] ${canSend ? '' : 'opacity-50 pointer-events-none'}`}
          >
            <MailIconInline /> Send via Email
          </a>
        )}
        {whatsappDigits && (
          <a
            href={canSend ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(body)}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!canSend}
            className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-500 ${canSend ? '' : 'opacity-50 pointer-events-none'}`}
          >
            <MessageCircle size={14} /> Send via WhatsApp
          </a>
        )}
      </div>
      <p className="mt-2 text-[10px] text-[var(--text-muted)]">Opens your email app or WhatsApp with the message pre-filled.</p>
    </div>
  );
};

const MailIconInline: React.FC = () => {
  const Icon = ICONS.Mail;
  return Icon ? <Icon size={14} /> : null;
};

const JsonPreviewView: React.FC<JsonPreviewViewProps> = ({ jsonData, fileId, portfolioData }) => {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const MailIcon = ICONS.Mail;
  const PhoneIcon = ICONS.Phone || MailIcon;
  const BriefcaseIcon = ICONS.Briefcase;
  const UserIcon = ICONS.User;
  const Code2Icon = ICONS.Code2;
  const LinkedinIcon = ICONS.Linkedin || Code2Icon;
  const InstagramIcon = ICONS.Instagram || Code2Icon;
  const TiktokIcon = ICONS.Tiktok || Code2Icon;
  const GithubIcon = ICONS.GitFork;
  const LinkIcon = ICONS.Link || Code2Icon;
  const InfoIcon = ICONS.about_portfolio || UserIcon;
  const ProjectIcon = ICONS.project_detail || BriefcaseIcon;
  const TechIcon = ICONS.Code2;
  const SparklesIcon = ICONS.SparklesIcon;
  const ExternalLink = ICONS.ExternalLinkIcon; 
  const ImageIcon = ICONS.ImageIcon; 


  const renderSectionTitle = (title: string, Icon?: React.ElementType, isAISuggestion?: boolean) => (
    <div className="flex items-center mb-4 mt-6 first:mt-0 pb-1.5 border-b border-[var(--border-color)]/50 relative">
      {isAISuggestion && SparklesIcon && <SparklesIcon size={18} className="text-yellow-400 mr-2 animate-pulse" />}
      {Icon && <Icon size={18} className="text-[var(--text-accent)] mr-2 flex-shrink-0" />}
      <h2 className="text-xs sm:text-sm font-bold tracking-widest text-[var(--text-accent)] uppercase">{title}</h2>
      <div className="absolute bottom-0 left-0 w-12 h-[2px] bg-gradient-to-r from-[var(--text-accent)] to-transparent"></div>
    </div>
  );

  const renderFormattedDescription = (desc: string) => {
    const lines = desc.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-')) {
        const content = trimmed.substring(1).trim();
        const isNested = line.startsWith('  -') || line.startsWith('    -') || line.startsWith('\t-');
        elements.push(
          <li 
            key={index} 
            className={`relative pl-3.5 mb-1.5 leading-relaxed text-xs sm:text-sm text-[var(--text-default)] ${
              isNested 
                ? 'ml-6 text-[var(--text-muted)] before:content-["○"] before:absolute before:left-0 before:text-[var(--text-accent)]/70' 
                : 'before:content-["•"] before:absolute before:left-0 before:text-[var(--text-accent)] font-medium'
            }`}
          >
            {content}
          </li>
        );
      } else if (trimmed) {
        elements.push(
          <p key={index} className="text-xs sm:text-sm text-[var(--text-default)] mb-2 leading-relaxed">
            {line}
          </p>
        );
      }
    });
    
    return <ul className="space-y-1.5 my-2.5">{elements}</ul>;
  };

  const renderClickableLink = (href: string, text: string, Icon?: React.ElementType) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] hover:underline break-all text-xs sm:text-sm"
    >
      {Icon && <Icon size={14} className="mr-1 sm:mr-1.5 flex-shrink-0" />}
      {text}
    </a>
  );

  const renderDetailItem = (label: string, value: string | React.ReactNode | string[] | number | undefined, Icon?: React.ElementType) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        return null;
    }
    let displayValue: React.ReactNode;
    if (Array.isArray(value)) {
      displayValue = (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <span key={index} className="px-2 py-0.5 bg-[var(--sidebar-item-hover-background)]/80 text-[var(--text-default)] rounded-md text-[10px] border border-[var(--border-color)]/60">
              {item}
            </span>
          ))}
        </div>
      );
    } else if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('mailto:') || value.startsWith('tel:'))) {
        displayValue = <span className="text-xs sm:text-sm break-all font-medium">{value}</span>
    } else {
      displayValue = <span className="text-xs sm:text-sm font-medium">{value as string | number}</span>;
    }

    return (
      <div className="mb-2 flex items-start">
        {Icon && <Icon size={14} className="text-[var(--text-muted)] mr-2 mt-0.5 flex-shrink-0" />}
        <div className="text-xs sm:text-sm">
          <span className="font-semibold text-[var(--editor-foreground)]/80">{label}: </span>
          <span className="text-[var(--text-default)]">{displayValue}</span>
        </div>
      </div>
    );
  };


  if (fileId.startsWith('project_') || fileId.startsWith('ai_project_')) {
    const project = jsonData as ProjectDetail;
    const isAISuggestion = fileId.startsWith('ai_project_');
    const images = project.imageUrls || [];
    const technologies = project.technologies || [];
    // Only show related skills when they add something beyond the technology list.
    const extraSkills = (project.related_skills || []).filter(skill => !technologies.includes(skill));

    const renderBulletList = (items: string[], Icon: React.ElementType, iconClass: string) => (
      <ul className="space-y-2 mb-4 ml-6 sm:ml-7">
        {items.map((item, index) => (
          <li key={index} className="flex items-start text-xs sm:text-sm text-[var(--text-default)] leading-relaxed">
            <Icon size={15} className={`mr-2 mt-0.5 flex-shrink-0 ${iconClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );

    return (
      <div className="p-4 sm:p-6 md:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
        {renderSectionTitle(isAISuggestion ? project.title : `Project: ${project.title}`, ProjectIcon, isAISuggestion)}
        {isAISuggestion && <p className="text-[0.65rem] sm:text-xs text-yellow-500 mb-2 sm:mb-3 ml-6 sm:ml-7 -mt-1 sm:-mt-2">This project idea was suggested by AI.</p>}

        <div className="flex flex-wrap items-center gap-2 mb-4 ml-6 sm:ml-7">
          {project.role && (
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--text-default)]">
              <UserCircle2 size={15} className="text-[var(--text-accent)]" /> {project.role}
            </span>
          )}
          {project.year && <span className="text-xs text-[var(--text-muted)]">· {project.year}</span>}
          {project.webLink && ExternalLink && (
            <a
              href={project.webLink}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:ml-auto inline-flex items-center px-3 py-1.5 bg-[var(--modal-button-background)] text-[var(--modal-button-foreground)] hover:bg-[var(--modal-button-hover-background)] rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--focus-border)] transition-colors shadow-sm"
            >
              <ExternalLink size={14} className="mr-1.5" />
              Visit Website
            </a>
          )}
        </div>

        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 ml-6 sm:ml-7">
            {technologies.map(tech => (
              <span key={tech} className="text-[10px] sm:text-xs font-semibold bg-[var(--text-accent)]/10 text-[var(--text-accent)] px-2 py-0.5 rounded-full border border-[var(--text-accent)]/20">
                {tech}
              </span>
            ))}
          </div>
        )}
        {extraSkills.length > 0 && <div className="ml-6 sm:ml-7">{renderDetailItem("Related Skills", extraSkills, Code2Icon)}</div>}

        {renderSectionTitle("Overview", InfoIcon)}
        <div className="text-xs sm:text-sm text-[var(--text-default)] mb-4 ml-6 sm:ml-7 whitespace-pre-line leading-relaxed">
          {renderFormattedDescription(project.description)}
        </div>

        {project.contributions && project.contributions.length > 0 && (
          <>
            {renderSectionTitle("Key Contributions", TechIcon)}
            {renderBulletList(project.contributions, CheckCircle2, 'text-[var(--text-accent)]')}
          </>
        )}

        {project.impact && project.impact.length > 0 && (
          <>
            {renderSectionTitle("Impact", TrendingUp)}
            {renderBulletList(project.impact, TrendingUp, 'text-emerald-400')}
          </>
        )}

        {images.length > 0 && (
          <>
            {renderSectionTitle("Project Visuals", ImageIcon)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ml-6 sm:ml-7 mb-4">
              {images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setLightboxIndex(index)}
                  className="group relative rounded-xl overflow-hidden border border-[var(--border-color)]/60 shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--focus-border)] cursor-zoom-in"
                  aria-label={`View ${project.title} visual ${index + 1} full screen`}
                >
                  <img
                    src={url}
                    alt={`${project.title} - Visual ${index + 1}`}
                    className="w-full h-auto object-contain max-h-60 group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </>
        )}

        {lightboxIndex !== null && images.length > 0 && (
          <ImageLightbox
            images={images}
            index={lightboxIndex}
            title={project.title}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </div>
    );
  }


  if (fileId === 'about.json') {
    const { name, nickname, summary, current_position, education } = jsonData as {
      name: string; nickname: string; summary?: string; current_position: Position; education: EducationEntry[];
    };
    return (
      <div className="p-4 sm:p-6 md:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
        {renderSectionTitle("About Me", UserIcon)}
        <div className="bg-[var(--sidebar-background)]/30 border border-[var(--border-color)]/60 rounded-xl p-4 sm:p-5 mb-4">
          {renderDetailItem("Full Name", name)}
          {renderDetailItem("Nickname", nickname)}
        </div>

        {summary && (
          <>
            {renderSectionTitle("Summary", InfoIcon)}
            <p className="text-[var(--text-default)] mb-4 whitespace-pre-line text-xs sm:text-sm leading-relaxed ml-6 sm:ml-7 bg-[var(--sidebar-background)]/20 p-4 rounded-xl border border-[var(--border-color)]/30">{summary}</p>
          </>
        )}

        {renderSectionTitle("Current Position", BriefcaseIcon)}
        <div className="bg-[var(--sidebar-background)]/30 border border-[var(--border-color)]/60 rounded-xl p-4 sm:p-5 mb-4 hover:border-[var(--text-accent)]/20 transition-all duration-300">
          {renderDetailItem("Role", current_position.role)}
          {renderDetailItem("Company", current_position.company)}
          {renderDetailItem("Period", current_position.period)}
          {current_position.description && (
            <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-2.5 ml-6 sm:ml-7 border-t border-[var(--border-color)]/30 pt-2.5">
              {renderFormattedDescription(current_position.description)}
            </div>
          )}
        </div>

        {renderSectionTitle("Education", Code2Icon)}
        <div className="relative pl-6 border-l-2 border-[var(--border-color)]/80 ml-4 space-y-5 my-4">
          {education.map((edu, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full bg-[var(--editor-background)] border-2 border-[var(--text-accent)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-accent)]"></div>
              </div>
              <p className="font-bold text-sm sm:text-base text-[var(--editor-foreground)]">{edu.school}</p>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium mt-0.5">{edu.major} ({edu.period})</p>
              {edu.gpa && <p className="text-xs text-[var(--text-accent)] font-semibold mt-0.5">GPA: {edu.gpa}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fileId === 'experience.json') {
    const { work_experience } = jsonData as { work_experience: WorkExperienceEntry[] };
    return (
      <div className="p-4 sm:p-6 md:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
        {renderSectionTitle("Work Experience", BriefcaseIcon)}
        <div className="space-y-4">
          {work_experience.map((exp, index) => (
            <div key={index} className="p-4 sm:p-5 border border-[var(--border-color)]/60 rounded-xl bg-[var(--sidebar-background)]/30 hover:border-[var(--text-accent)]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 text-left">
              <h3 className="text-sm sm:text-base font-bold text-[var(--link-foreground)]">{exp.role}</h3>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-default)] mt-0.5">{exp.company}</p>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium mb-2">{exp.period}</p>
              {exp.description && (
                <div className="border-t border-[var(--border-color)]/30 mt-3 pt-3">
                  {renderFormattedDescription(exp.description)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fileId === 'skills.json') {
    const { skills } = jsonData as { skills: string[] };

    const categories: { label: string; color: string; borderColor: string; keys: string[] }[] = [
      {
        label: 'Mobile Development',
        color: 'text-[#00B4AB]',
        borderColor: 'border-[#00B4AB]',
        keys: ['Flutter', 'Dart', 'Firebase', 'REST API'],
      },
      {
        label: 'Frontend Web',
        color: 'text-[#F7DF1E]',
        borderColor: 'border-[#F7DF1E]',
        keys: ['Vue.js', 'Nuxt.js', 'React', 'HTML', 'CSS'],
      },
      {
        label: 'Backend',
        color: 'text-[#777BB4]',
        borderColor: 'border-[#777BB4]',
        keys: ['PHP', 'Laravel'],
      },
      {
        label: 'Tools & DevOps',
        color: 'text-[var(--text-accent)]',
        borderColor: 'border-[var(--text-accent)]',
        keys: ['Git', 'GitHub', 'CI/CD', 'Figma', 'Prompt Engineering AI'],
      },
    ];

    const categorisedKeys = categories.flatMap(c => c.keys);
    const otherSkills = skills.filter(s => !categorisedKeys.includes(s));

    return (
      <div className="p-4 sm:p-6 md:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
        {renderSectionTitle('Skills', Code2Icon)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {categories.map(cat => {
            const matched = skills.filter(s => cat.keys.includes(s));
            if (!matched.length) return null;
            return (
              <div key={cat.label} className="p-4 sm:p-5 bg-[var(--sidebar-background)]/35 border border-[var(--border-color)]/60 rounded-xl hover:border-[var(--border-color)] transition-all duration-300">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${cat.color}`}>
                  {cat.label}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {matched.map((skill, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 bg-[var(--sidebar-item-hover-background)]/70 rounded-full text-xs font-semibold border ${cat.borderColor}/40 ${cat.color} hover:scale-[1.03] transition-transform duration-150 cursor-default shadow-sm`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {otherSkills.length > 0 && (
            <div className="p-4 sm:p-5 bg-[var(--sidebar-background)]/35 border border-[var(--border-color)]/60 rounded-xl hover:border-[var(--border-color)] transition-all duration-300">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-[var(--text-muted)]">
                Domain Experience
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {otherSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-[var(--sidebar-item-hover-background)]/75 text-[var(--text-default)] rounded-full text-xs font-semibold border border-[var(--border-color)] shadow-sm cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }


  if (fileId === 'contact.json') {
    const { email, phone, address, linkedIn, instagram, tiktok, otherSocial } = jsonData as PortfolioData;
    return (
      <div className="p-4 sm:p-6 md:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
        {renderSectionTitle("Contact Information", MailIcon)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {email && (
            <div className="p-5 rounded-xl border border-[var(--border-color)]/60 bg-[var(--sidebar-background)]/30 backdrop-blur-sm flex flex-col justify-between hover:border-[var(--text-accent)]/30 hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex items-center text-[var(--text-accent)] mb-2">
                  <MailIcon size={16} className="mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Email Address</span>
                </div>
                <p className="text-sm font-semibold text-[var(--editor-foreground)] break-all">{email}</p>
              </div>
              <a href={`mailto:${email}`} className="mt-4 inline-flex items-center justify-center text-xs font-bold px-3 py-2 bg-[var(--modal-button-background)] text-[var(--modal-button-foreground)] rounded-lg hover:bg-[var(--modal-button-hover-background)] transition-colors duration-200">
                Send Email
              </a>
            </div>
          )}
          
          {phone && (
            <div className="p-5 rounded-xl border border-[var(--border-color)]/60 bg-[var(--sidebar-background)]/30 backdrop-blur-sm flex flex-col justify-between hover:border-[var(--text-accent)]/30 hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex items-center text-[var(--text-accent)] mb-2">
                  <PhoneIcon size={16} className="mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Phone / WhatsApp</span>
                </div>
                <p className="text-sm font-semibold text-[var(--editor-foreground)]">{toInternationalPhone(phone).display}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={`https://wa.me/${toInternationalPhone(phone).digits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors duration-200">
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a href={`tel:+${toInternationalPhone(phone).digits}`} className="inline-flex items-center justify-center text-xs font-bold px-3 py-2 bg-[var(--modal-button-background)] text-[var(--modal-button-foreground)] rounded-lg hover:bg-[var(--modal-button-hover-background)] transition-colors duration-200">
                  Call
                </a>
              </div>
            </div>
          )}

          {address && (
            <div className="p-5 rounded-xl border border-[var(--border-color)]/60 bg-[var(--sidebar-background)]/30 backdrop-blur-sm flex flex-col justify-between hover:border-[var(--text-accent)]/30 hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex items-center text-[var(--text-accent)] mb-2">
                  <UserIcon size={16} className="mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                </div>
                <p className="text-sm font-semibold text-[var(--editor-foreground)]">{address.full}</p>
              </div>
              <span className="mt-4 text-[10px] text-[var(--text-muted)] font-medium text-center italic">
                Available for remote or on-site roles
              </span>
            </div>
          )}

          <div className="p-5 rounded-xl border border-[var(--border-color)]/60 bg-[var(--sidebar-background)]/30 backdrop-blur-sm flex flex-col justify-between hover:border-[var(--text-accent)]/30 hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex items-center text-[var(--text-accent)] mb-2">
                <LinkIcon size={16} className="mr-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Social Links</span>
              </div>
              <div className="space-y-2 mt-2">
                {linkedIn && (
                  <a href={linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] hover:underline">
                    <LinkedinIcon size={14} className="mr-2" /> LinkedIn Profile
                  </a>
                )}
                {otherSocial && otherSocial.name.toLowerCase() === 'github' && (
                  <a href={otherSocial.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] hover:underline">
                    <GithubIcon size={14} className="mr-2" /> GitHub Account
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] hover:underline">
                    <InstagramIcon size={14} className="mr-2" /> Instagram
                  </a>
                )}
              </div>
            </div>
            <span className="mt-4 text-[10px] text-[var(--text-muted)] font-medium text-center italic">
              Connect on social platforms
            </span>
          </div>

          <ContactComposer email={email} whatsappDigits={phone ? toInternationalPhone(phone).digits : undefined} />
        </div>
      </div>
    );
  }

  if (fileId === 'projects.json') {
      const { projects } = jsonData as { projects: { id: string; title: string }[] };
      return (
        <div className="p-4 sm:p-6 md:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
            {renderSectionTitle("Projects List Preview", ProjectIcon)}
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-4 ml-6 sm:ml-7 bg-[var(--sidebar-background)]/20 p-4 rounded-xl border border-[var(--border-color)]/30 leading-relaxed">
                This is a preview of the <code>projects.json</code> file. It lists all available projects.
                To see detailed cards for each project, open <code>projects.json</code> normally (not in preview).
            </p>
            <ul className="text-xs sm:text-sm ml-6 sm:ml-7 space-y-2">
                {projects.map(p => (
                    <li key={p.id} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-[var(--text-accent)] rounded-full mr-2.5"></span>
                        <span className="font-semibold text-[var(--editor-foreground)]">{p.title}</span>
                        <span className="text-[var(--text-muted)] text-[10px] ml-2 font-mono">({p.id})</span>
                    </li>
                ))}
            </ul>
        </div>
      );
  }


  return (
    <div className="p-4 bg-[var(--editor-background)] text-[var(--editor-foreground)]">
      <h2 className="text-xl font-semibold text-red-500">Preview Not Available</h2>
      <p>The preview for this file type ({fileId}) is not configured, or the data is not in the expected format.</p>
      <pre className="mt-4 p-2 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded text-xs overflow-auto">
        {JSON.stringify(jsonData, null, 2)}
      </pre>
    </div>
  );
};

export default JsonPreviewView;
    