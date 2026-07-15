import React, { useState, useEffect, useMemo } from 'react';
import { GitHubUser, GitHubEvent, GitHubRepo, MockGitHubStats, LogLevel, FeatureStatus } from '../../App/types';
import { ICONS, ALL_FEATURE_IDS } from '../../App/constants';
import { 
  Github, 
  Users, 
  Star, 
  GitFork, 
  Briefcase, 
  MapPin, 
  Link as LinkIcon, 
  ExternalLink, 
  AlertTriangle, 
  MessageSquare, 
  GitCommit, 
  Flame,
  Calendar,
  Search,
  Code2,
  Clock,
  BookOpen
} from 'lucide-react';
import MaintenanceView from '../../UI/MaintenanceView';

interface GitHubProfileViewProps {
  username: string | undefined;
  mockStats: MockGitHubStats;
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void;
  featureStatus: FeatureStatus;
}

const GITHUB_API_BASE_URL = 'https://api.github.com';

const getGitHubApiError = async (response: Response, resource: string): Promise<string> => {
  const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
  if (response.status === 403 && rateLimitRemaining === '0') {
    return `GitHub API rate limit reached while loading ${resource}. Please try again later.`;
  }

  let apiMessage = '';
  try {
    const body = await response.clone().json() as { message?: string };
    apiMessage = body.message || '';
  } catch {
    // Some network intermediaries return a non-JSON response.
  }

  const statusLabel = response.statusText || `HTTP ${response.status}`;
  return `Unable to load GitHub ${resource} (${statusLabel})${apiMessage ? `: ${apiMessage}` : ''}.`;
};

const getLanguageColor = (lang: string): string => {
  const colors: { [key: string]: string } = {
    javascript: '#f1e05a',
    typescript: '#3178c6',
    dart: '#00b4ab',
    vue: '#41b883',
    html: '#e34c26',
    css: '#563d7c',
    python: '#3572a5',
    php: '#4f5d95',
    java: '#b07219',
    go: '#00add8',
    rust: '#dea584',
    ruby: '#701516',
    c: '#555555',
    'c++': '#f34b7d',
    'c#': '#178600',
    swift: '#f05138',
    kotlin: '#a97bff',
    shell: '#89e051',
  };
  return colors[lang.toLowerCase()] || '#8b949e';
};

// Shimmer Loader for visual excellence during loading
const ShimmerLoader: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto animate-pulse">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile Header Shimmer */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[var(--editor-tab-inactive-background)] flex-shrink-0" />
          <div className="flex-1 space-y-3 w-full text-center sm:text-left">
            <div className="h-8 bg-[var(--editor-tab-inactive-background)] rounded-md w-1/3 mx-auto sm:mx-0" />
            <div className="h-5 bg-[var(--editor-tab-inactive-background)] rounded-md w-1/4 mx-auto sm:mx-0" />
            <div className="h-4 bg-[var(--editor-tab-inactive-background)] rounded-md w-3/4 mx-auto sm:mx-0 mt-4" />
            <div className="flex justify-center sm:justify-start space-x-4 pt-2">
              <div className="h-4 bg-[var(--editor-tab-inactive-background)] rounded-md w-16" />
              <div className="h-4 bg-[var(--editor-tab-inactive-background)] rounded-md w-24" />
              <div className="h-4 bg-[var(--editor-tab-inactive-background)] rounded-md w-20" />
            </div>
          </div>
        </div>

        {/* Stats Grid Shimmer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl h-24" />
          ))}
        </div>

        {/* Contribution Graph Shimmer */}
        <div className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl space-y-3">
          <div className="h-6 bg-[var(--editor-tab-inactive-background)] rounded-md w-1/4" />
          <div className="h-28 bg-[var(--editor-tab-inactive-background)] rounded-md w-full" />
        </div>

        {/* Two Column Layout Shimmer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Languages Shimmer */}
          <div className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl space-y-4 h-fit">
            <div className="h-6 bg-[var(--editor-tab-inactive-background)] rounded-md w-1/2" />
            <div className="h-4 bg-[var(--editor-tab-inactive-background)] rounded-md w-full" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 bg-[var(--editor-tab-inactive-background)] rounded-md w-1/3" />
                  <div className="h-4 bg-[var(--editor-tab-inactive-background)] rounded-md w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Repositories Shimmer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-[var(--editor-tab-inactive-background)] rounded-md w-1/3" />
              <div className="h-8 bg-[var(--editor-tab-inactive-background)] rounded-md w-1/4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl space-y-3 h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GitHubProfileView: React.FC<GitHubProfileViewProps> = ({ username, mockStats, addAppLog, featureStatus }) => {
  const [profile, setProfile] = useState<GitHubUser | null>(null);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and Sort states for repos
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [sortBy, setSortBy] = useState<'stars' | 'forks' | 'updated' | 'name'>('stars');

  useEffect(() => {
    if (featureStatus !== 'active') return;

    if (!username) {
      setError("GitHub username is not configured for this view.");
      addAppLog('error', "GitHub username not provided to GitHubProfileView.", 'GitHubProfileView');
      return;
    }

    const fetchGitHubData = async () => {
      setLoading(true);
      setError(null);
      addAppLog('info', `Fetching GitHub data for user: ${username}`, 'GitHubProfileView');

      try {
        const [profileRes, eventsRes, reposRes] = await Promise.all([
          fetch(`${GITHUB_API_BASE_URL}/users/${username}`),
          fetch(`${GITHUB_API_BASE_URL}/users/${username}/events/public?per_page=15`), 
          fetch(`${GITHUB_API_BASE_URL}/users/${username}/repos?sort=updated&per_page=100`)
        ]);

        if (!profileRes.ok) {
          throw new Error(await getGitHubApiError(profileRes, 'profile'));
        }
        const profileData: GitHubUser = await profileRes.json();
        setProfile(profileData);
        addAppLog('debug', 'GitHub profile data fetched.', 'GitHubProfileView', { name: profileData.name });

        if (!eventsRes.ok) {
          throw new Error(await getGitHubApiError(eventsRes, 'events'));
        }
        const eventsData: GitHubEvent[] = await eventsRes.json();
        setEvents(eventsData);
        addAppLog('debug', `GitHub events fetched: ${eventsData.length}.`, 'GitHubProfileView');
        
        if (!reposRes.ok) {
          throw new Error(await getGitHubApiError(reposRes, 'repositories'));
        }
        const reposData: GitHubRepo[] = await reposRes.json();
        setRepos(reposData);
        addAppLog('debug', `GitHub repositories fetched: ${reposData.length}.`, 'GitHubProfileView');

      } catch (err: any) {
        setError(err.message);
        addAppLog('error', 'Error fetching GitHub data.', 'GitHubProfileView', { errorMessage: err.message });
        console.error("GitHubProfileView Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [username, addAppLog, featureStatus]);

  // Aggregate stats from fetched repositories
  const aggregatedStats = useMemo(() => {
    let stars = 0;
    let forks = 0;
    repos.forEach(repo => {
      stars += repo.stargazers_count || 0;
      forks += repo.forks_count || 0;
    });
    return { stars, forks };
  }, [repos]);

  // Dynamic language stats calculation from actual repos
  const languageStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    let total = 0;
    
    repos.forEach(repo => {
      if (repo.language) {
        counts[repo.language] = (counts[repo.language] || 0) + 1;
        total++;
      }
    });

    if (total === 0) {
      return mockStats.topLanguages.map(lang => ({
        name: lang.name,
        count: 0,
        percentage: lang.percentage,
        color: lang.color || getLanguageColor(lang.name)
      }));
    }

    return Object.entries(counts)
      .map(([name, count]) => {
        const percentage = Math.round((count / total) * 100);
        return {
          name,
          count,
          percentage,
          color: getLanguageColor(name)
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [repos, mockStats.topLanguages]);

  // Get all unique languages in repos list for the filter dropdown
  const uniqueLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach(repo => {
      if (repo.language) langs.add(repo.language);
    });
    return ['All', ...Array.from(langs)].sort();
  }, [repos]);

  // Filter and sort repos
  const filteredAndSortedRepos = useMemo(() => {
    let result = [...repos];

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(repo => 
        repo.name.toLowerCase().includes(lowerSearch) || 
        (repo.description && repo.description.toLowerCase().includes(lowerSearch))
      );
    }

    // Filter by language
    if (selectedLanguage !== 'All') {
      result = result.filter(repo => repo.language === selectedLanguage);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'stars') {
        return b.stargazers_count - a.stargazers_count;
      } else if (sortBy === 'forks') {
        return b.forks_count - a.forks_count;
      } else if (sortBy === 'updated') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      } else { // name
        return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [repos, searchTerm, selectedLanguage, sortBy]);

  // Top repositories (featured) - dynamic from real repos
  const featuredRepos = useMemo(() => {
    return [...repos]
      .filter(repo => !repo.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3);
  }, [repos]);

  if (featureStatus !== 'active') {
    return <MaintenanceView featureName={ALL_FEATURE_IDS.githubProfileView} featureIcon={ICONS.github_icon} />;
  }

  if (loading) {
    return <ShimmerLoader />;
  }

  if (error) {
    return (
      <div className="p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
        <div className="mx-auto max-w-md p-6 rounded-xl bg-[var(--notification-error-background)] text-[var(--notification-error-foreground)] border border-[var(--notification-error-border)] shadow-lg">
          <div className="flex items-center">
            <AlertTriangle size={28} className="mr-3 text-[var(--notification-error-icon)] flex-shrink-0 animate-bounce" />
            <h2 className="text-xl font-bold">Error Loading GitHub Data</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto flex items-center justify-center">
        <p className="text-lg text-[var(--text-muted)] bg-[var(--sidebar-background)] border border-[var(--border-color)] px-6 py-4 rounded-lg">
          GitHub profile data not available.
        </p>
      </div>
    );
  }

  const formatEventTitle = (event: GitHubEvent): React.ReactNode => {
    const repoLink = (
      <a href={`https://github.com/${event.repo.name}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--link-foreground)] hover:underline truncate" title={event.repo.name}>
        {event.repo.name.split('/')[1] || event.repo.name}
      </a>
    );

    switch (event.type) {
      case 'PushEvent':
        return <>Pushed to {repoLink}</>;
      case 'CreateEvent':
        return <>Created {event.payload.ref_type || 'repository'} {event.payload.ref ? <code className="text-xs bg-[var(--editor-tab-inactive-background)] px-1 py-0.5 rounded text-[var(--text-accent)]">{event.payload.ref}</code> : ''} in {repoLink}</>;
      case 'PullRequestEvent':
        return <>{event.payload.action || 'Interacted with'} PR <a href={event.payload.pull_request?.html_url} target="_blank" rel="noopener noreferrer" className="text-[var(--link-foreground)] hover:underline">#{event.payload.pull_request?.number}</a> in {repoLink}</>;
      case 'IssuesEvent':
        return <>{event.payload.action || 'Interacted with'} issue <a href={event.payload.issue?.html_url} target="_blank" rel="noopener noreferrer" className="text-[var(--link-foreground)] hover:underline">#{event.payload.issue?.number}</a> in {repoLink}</>;
      case 'ForkEvent':
        return <>Forked {repoLink} to <a href={event.payload.forkee?.html_url} target="_blank" rel="noopener noreferrer" className="text-[var(--link-foreground)] hover:underline">{event.payload.forkee?.full_name}</a></>;
      case 'WatchEvent':
        return <>Starred {repoLink}</>;
      case 'PublicEvent':
        return <>Made {repoLink} public</>;
      case 'ReleaseEvent':
        return <>Published release <a href={event.payload.release?.html_url} target="_blank" rel="noopener noreferrer" className="text-[var(--link-foreground)] hover:underline">{event.payload.release?.name || event.payload.release?.tag_name}</a> in {repoLink}</>;
      default:
        return <>Performed {event.type.replace('Event', '')} on {repoLink}</>;
    }
  };

  const renderEventDetails = (event: GitHubEvent): React.ReactNode => {
    switch (event.type) {
      case 'PushEvent':
        const commits = event.payload.commits?.slice(0, 3) || [];
        if (commits.length === 0) return <p className="text-xs text-[var(--text-muted)] pl-7">No commit details available.</p>;
        return (
          <ul className="pl-7 mt-1.5 space-y-1">
            {commits.map(commit => (
              <li key={commit.sha} className="text-xs text-[var(--text-muted)] flex items-start">
                <GitCommit size={12} className="mr-2 mt-0.5 text-[var(--text-accent)] flex-shrink-0" />
                <span className="truncate max-w-md sm:max-w-xl md:max-w-2xl font-mono" title={commit.message}>{commit.message.split('\n')[0]}</span>
              </li>
            ))}
            {event.payload.commits && event.payload.commits.length > 3 && (
              <li className="text-xs text-[var(--text-muted)] pl-5 italic">...and {event.payload.commits.length - 3} more commits.</li>
            )}
          </ul>
        );
      case 'PullRequestEvent':
        if (event.payload.pull_request?.title) {
          return <p className="text-xs text-[var(--text-muted)] pl-7 mt-1 flex items-center gap-1.5"><MessageSquare size={12} className="text-[var(--text-accent)] flex-shrink-0" /> <span className="truncate max-w-lg font-medium">{event.payload.pull_request.title}</span></p>;
        }
        return null;
      case 'IssuesEvent':
        if (event.payload.issue?.title) {
          return <p className="text-xs text-[var(--text-muted)] pl-7 mt-1 flex items-center gap-1.5"><MessageSquare size={12} className="text-[var(--text-accent)] flex-shrink-0" /> <span className="truncate max-w-lg font-medium">{event.payload.issue.title}</span></p>;
        }
        return null;
      case 'ReleaseEvent':
        if (event.payload.release?.body) {
          return <p className="text-xs text-[var(--text-muted)] pl-7 mt-1 border-l border-[var(--border-color)] ml-1.5 py-0.5 line-clamp-2 max-w-lg">{event.payload.release.body}</p>;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[var(--editor-background)] text-[var(--editor-foreground)] h-full overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Profile Card Header */}
        <header className="relative overflow-hidden border border-[var(--border-color)] rounded-xl bg-gradient-to-r from-[var(--sidebar-background)] via-[var(--sidebar-background)] to-[var(--text-accent)]/5 shadow-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--text-accent)] to-[var(--focus-border)]" />
          <div className="flex flex-col sm:flex-row items-center sm:items-start p-6 space-y-4 sm:space-y-0 sm:space-x-6">
            <img 
              src={profile.avatar_url} 
              alt={`${profile.name || profile.login}'s avatar`} 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[var(--focus-border)] shadow-lg hover:scale-105 transition-transform duration-300 flex-shrink-0"
            />
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--editor-tab-active-foreground)] tracking-tight truncate">{profile.name || profile.login}</h1>
              <p className="text-md sm:text-lg text-[var(--text-accent)] font-medium -mt-0.5">@{profile.login}</p>
              {profile.bio && <p className="text-sm mt-3 text-[var(--text-default)] leading-relaxed max-w-2xl">{profile.bio}</p>}
              
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-2 text-xs text-[var(--text-muted)] mt-4">
                {profile.company && (
                  <span className="flex items-center" title="Company">
                    <Briefcase size={13} className="mr-1.5 text-[var(--text-accent)]" /> {profile.company}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center" title="Location">
                    <MapPin size={13} className="mr-1.5 text-[var(--text-accent)]" /> {profile.location}
                  </span>
                )}
                {profile.blog && (
                  <a 
                    href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] hover:underline truncate"
                  >
                    <LinkIcon size={13} className="mr-1.5" /> {profile.blog.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs mt-4 pt-4 border-t border-[var(--border-color)]/50">
                <a href={`${profile.html_url}?tab=followers`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--link-foreground)] flex items-center transition-colors">
                  <Users size={14} className="mr-1.5 text-[var(--text-muted)]" /> <strong className="font-semibold text-[var(--editor-tab-active-foreground)]">{profile.followers}</strong>&nbsp;followers
                </a>
                <span className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                <a href={`${profile.html_url}?tab=following`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--link-foreground)] flex items-center transition-colors">
                  <strong className="font-semibold text-[var(--editor-tab-active-foreground)]">{profile.following}</strong>&nbsp;following
                </a>
                <span className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                <a href={`${profile.html_url}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--link-foreground)] flex items-center transition-colors">
                  <BookOpen size={14} className="mr-1.5 text-[var(--text-muted)]" /> <strong className="font-semibold text-[var(--editor-tab-active-foreground)]">{profile.public_repos}</strong>&nbsp;repositories
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl flex items-center space-x-4 shadow-sm hover:border-[var(--focus-border)]/50 transition-colors">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
              <Calendar size={22} />
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold block">Contributions</span>
              <span className="text-xl font-bold text-[var(--editor-tab-active-foreground)]">{mockStats.totalContributionsLastYear}</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl flex items-center space-x-4 shadow-sm hover:border-[var(--focus-border)]/50 transition-colors">
            <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 animate-pulse">
              <Flame size={22} />
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold block">Commit Streak</span>
              <span className="text-xl font-bold text-[var(--editor-tab-active-foreground)]">{mockStats.commitStreak} Days</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl flex items-center space-x-4 shadow-sm hover:border-[var(--focus-border)]/50 transition-colors">
            <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Star size={22} />
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold block">Total Stars</span>
              <span className="text-xl font-bold text-[var(--editor-tab-active-foreground)]">{aggregatedStats.stars}</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl flex items-center space-x-4 shadow-sm hover:border-[var(--focus-border)]/50 transition-colors">
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
              <GitFork size={22} />
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold block">Total Forks</span>
              <span className="text-xl font-bold text-[var(--editor-tab-active-foreground)]">{aggregatedStats.forks}</span>
            </div>
          </div>
        </section>

        {/* Contribution Graph Calendar View */}
        <section className="p-5 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border-color)]/30 pb-3">
            <h2 className="text-lg font-bold text-[var(--editor-tab-active-foreground)] flex items-center gap-2">
              <Calendar size={18} className="text-[var(--text-accent)]" /> Contribution Graph
            </h2>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {mockStats.totalContributionsLastYear} commits in the last 12 months
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-x-auto pb-2">
            <div className="flex items-start space-x-2">
              {/* Day Labels */}
              <div className="flex flex-col justify-between text-[0.65rem] text-[var(--text-muted)] h-[82px] pr-2 pt-1 font-mono">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* Grid Box */}
              <div className="contribution-graph select-none">
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div key={dayIndex} className="contribution-graph-row">
                    {mockStats.contributionGraphData.map((week, weekIndex) => {
                      const level = week[dayIndex];
                      return (
                        <div
                          key={weekIndex}
                          className={`contribution-day level-${level}`}
                          title={`Activity level ${level}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Side Card Stats */}
            <div className="flex md:flex-col justify-between md:justify-center gap-3 text-xs border-t md:border-t-0 md:border-l border-[var(--border-color)]/50 pt-3 md:pt-0 md:pl-6 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-[#0e4429]" />
                <span className="text-[var(--text-muted)]">Low Activity</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-[#006d32]" />
                <span className="text-[var(--text-muted)]">Medium Activity</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-[#26a641]" />
                <span className="text-[var(--text-muted)]">High Activity</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-[#39d353]" />
                <span className="text-[var(--text-muted)]">Extremely Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Multi-Column Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Languages Breakdown & Quick Info */}
          <div className="space-y-6">
            
            {/* Languages Breakdown */}
            <div className="p-5 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl shadow-sm space-y-4 h-fit">
              <h2 className="text-md font-bold text-[var(--editor-tab-active-foreground)] border-b border-[var(--border-color)]/30 pb-2.5 flex items-center gap-2">
                <Code2 size={16} className="text-[var(--text-accent)]" /> Languages Distribution
              </h2>
              
              {/* Stacked Percentage Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-[var(--editor-tab-inactive-background)]">
                {languageStats.map(lang => (
                  <div
                    key={lang.name}
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: lang.color
                    }}
                    title={`${lang.name}: ${lang.percentage}%`}
                    className="h-full transition-all duration-300 hover:brightness-110"
                  />
                ))}
              </div>

              {/* Legends */}
              <div className="space-y-2.5">
                {languageStats.map(lang => (
                  <div key={lang.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: lang.color }}
                      />
                      <span className="font-semibold text-[var(--editor-foreground)] truncate">{lang.name}</span>
                    </div>
                    <div className="flex space-x-2 text-[var(--text-muted)] flex-shrink-0">
                      <span>{lang.percentage}%</span>
                      {lang.count > 0 && <span>({lang.count} repos)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Section */}
            {featuredRepos.length > 0 && (
              <div className="p-5 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl shadow-sm space-y-4">
                <h2 className="text-md font-bold text-[var(--editor-tab-active-foreground)] border-b border-[var(--border-color)]/30 pb-2.5 flex items-center gap-2">
                  <Star size={16} className="text-[var(--text-accent)]" /> Popular Repositories
                </h2>
                <div className="space-y-3">
                  {featuredRepos.map(repo => (
                    <div key={repo.id} className="p-3 bg-[var(--editor-background)] border border-[var(--border-color)]/60 rounded-lg hover:border-[var(--focus-border)] transition-colors">
                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[var(--link-foreground)] hover:underline flex items-center justify-between">
                        <span className="truncate">{repo.name}</span>
                        <ExternalLink size={12} className="flex-shrink-0 ml-1.5 opacity-75" />
                      </a>
                      <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                        {repo.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center space-x-3 mt-3 text-[10px] text-[var(--text-muted)]">
                        {repo.language && (
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                            <span>{repo.language}</span>
                          </span>
                        )}
                        <span className="flex items-center"><Star size={10} className="mr-1 text-yellow-500" /> {repo.stargazers_count}</span>
                        <span className="flex items-center"><GitFork size={10} className="mr-1" /> {repo.forks_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Repositories Browser */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Browser Filters */}
            <div className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[var(--editor-background)] text-[var(--editor-foreground)] pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-[var(--focus-border)] text-sm"
                  />
                </div>

                {/* Filter & Sort Controls */}
                <div className="flex gap-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-[var(--editor-background)] text-[var(--editor-foreground)] px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-[var(--focus-border)] text-xs cursor-pointer max-w-[120px]"
                  >
                    <option value="All">All Languages</option>
                    {uniqueLanguages.filter(l => l !== 'All').map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[var(--editor-background)] text-[var(--editor-foreground)] px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-[var(--focus-border)] text-xs cursor-pointer"
                  >
                    <option value="stars">Sort: Stars</option>
                    <option value="forks">Sort: Forks</option>
                    <option value="updated">Sort: Updated</option>
                    <option value="name">Sort: Name</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Repositories Grid */}
            {filteredAndSortedRepos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAndSortedRepos.slice(0, 12).map(repo => ( // Limit to 12 repos to keep UI elegant
                  <div key={repo.id} className="p-4 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl flex flex-col justify-between hover:border-[var(--focus-border)] transition-colors shadow-sm group">
                    <div>
                      <div className="flex items-start justify-between">
                        <a 
                          href={repo.html_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm font-bold text-[var(--link-foreground)] group-hover:text-[var(--link-hover-foreground)] hover:underline truncate mr-2"
                        >
                          {repo.name}
                        </a>
                        <ExternalLink size={12} className="text-[var(--text-muted)] opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed h-8">
                        {repo.description || 'No description available.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color)]/30 text-[10px] text-[var(--text-muted)]">
                      <div className="flex items-center space-x-3">
                        {repo.language && (
                          <span className="flex items-center space-x-1 bg-[var(--editor-tab-inactive-background)] px-1.5 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                            <span>{repo.language}</span>
                          </span>
                        )}
                        <span className="flex items-center" title={`${repo.stargazers_count} stars`}><Star size={10} className="mr-1 text-yellow-500" /> {repo.stargazers_count}</span>
                        <span className="flex items-center" title={`${repo.forks_count} forks`}><GitFork size={10} className="mr-1" /> {repo.forks_count}</span>
                      </div>
                      <span className="flex items-center gap-1 font-mono text-[9px]">
                        <Clock size={9} /> {new Date(repo.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl">
                <p className="text-sm text-[var(--text-muted)]">No repositories found matching your filters.</p>
              </div>
            )}

            {filteredAndSortedRepos.length > 12 && (
              <div className="text-center pt-2">
                <a 
                  href={`${profile.html_url}?tab=repositories`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-semibold text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] hover:underline inline-flex items-center gap-1"
                >
                  View other {filteredAndSortedRepos.length - 12} repositories on GitHub <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Recent Public Activity Section */}
        <section className="p-5 bg-[var(--sidebar-background)] border border-[var(--border-color)] rounded-xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[var(--editor-tab-active-foreground)] border-b border-[var(--border-color)]/30 pb-3 flex items-center gap-2">
            <Github size={18} className="text-[var(--text-accent)]" /> Recent Public Activity
          </h2>
          
          {events.length > 0 ? (
            <div className="relative pl-6 border-l border-[var(--border-color)] ml-3.5 space-y-6 py-2">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className="relative group">
                  
                  {/* Timeline Dot Node */}
                  <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-[var(--editor-background)] border border-[var(--border-color)] shadow-sm group-hover:border-[var(--focus-border)] transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-accent)] group-hover:scale-110 transition-transform" />
                  </span>
                  
                  {/* Content Container */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between text-xs">
                      <div className="text-[var(--text-default)] font-medium flex items-center gap-1.5">
                        {formatEventTitle(event)}
                      </div>
                      <span className="text-[var(--text-muted)] font-mono text-[9px]">
                        {new Date(event.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {renderEventDetails(event)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No recent public activity found.</p>
          )}

          <div className="mt-4 text-center border-t border-[var(--border-color)]/20 pt-3">
            <a 
              href={`${profile.html_url}?tab=overview`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-semibold text-[var(--link-foreground)] hover:text-[var(--link-hover-foreground)] hover:underline inline-flex items-center"
            >
              View Full Activity Profile on GitHub <ExternalLink size={12} className="ml-1.5" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
