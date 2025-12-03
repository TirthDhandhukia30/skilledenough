export interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  avatar_url: string;
  html_url: string;
}

export interface Repository {
  name: string;
  description: string;
  language: string;
  languages_url: string;
  stargazers_count: number;
  forks_count: number;
  size: number;
  created_at: string;
  updated_at: string;
  topics: string[];
  html_url: string;
}

export interface LanguageStats {
  [language: string]: number;
}

export interface TechStack {
  primary: string[];
  secondary: string[];
  frameworks: string[];
  tools: string[];
}

export interface StackDepth {
  core: string[];
  supporting: string[];
  emerging: string[];
}

export interface SkillAnalysis {
  techStack: TechStack;
  topLanguages: { language: string; percentage: number }[];
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  totalProjects: number;
  activeProjects: number;
  accountAge: number;
  stackDepth: StackDepth;
}

export interface RepositoryHighlight {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  lastUpdated: string;
  createdAt: string;
  topics: string[];
  url: string;
  reason: string;
}

export interface ActivityMetrics {
  recentPushes: number;
  activeLast30Days: number;
  activeLast90Days: number;
  medianUpdateInterval: number;
  longestQuietStreak: number;
  velocityScore: number;
}

export interface QualitySignals {
  testing: 'Strong' | 'Moderate' | 'Sparse';
  automation: 'Advanced' | 'Basic' | 'None';
  documentation: 'Comprehensive' | 'Moderate' | 'Sparse';
  releaseCadence: 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly' | 'Ad-hoc';
  notes: string[];
}

export interface TimelineEvent {
  year: number;
  title: string;
  description: string;
}

export interface Opportunities {
  jobRoles: string[];
  industries: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface FuturePrediction {
  growthAreas: string[];
  skillsToLearn: string[];
  careerPath: string[];
  marketDemand: 'Low' | 'Medium' | 'High' | 'Very High';
}

export interface ContributionStats {
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  totalIssues: number;
  closedIssues: number;
  recentPRs: {
    repo: string;
    title: string;
    state: 'open' | 'closed' | 'merged';
    url: string;
    createdAt: string;
  }[];
}

export interface AnalysisResult {
  user: GitHubUser;
  skillAnalysis: SkillAnalysis;
  opportunities: Opportunities;
  futurePrediction: FuturePrediction;
  highlights: RepositoryHighlight[];
  activity: ActivityMetrics;
  quality: QualitySignals;
  timeline: TimelineEvent[];
  contributions?: ContributionStats;
}
