import type {
  GitHubUser,
  SkillAnalysis,
  Opportunities,
  FuturePrediction,
  AnalysisResult,
  TechStack,
  RepositoryHighlight,
  ActivityMetrics,
  QualitySignals,
  TimelineEvent,
  StackDepth,
  ContributionStats,
} from '../types/github';

export interface RepositoryWithLanguages {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  html_url: string;
  topics: string[];
  languageStats?: { [key: string]: number };
}

export class SkillAnalyzer {
  private frameworkKeywords = {
    React: ['react', 'reactjs'],
    'Next.js': ['next.js', 'nextjs'],
    'Gatsby': ['gatsby'],
    Angular: ['angular', '@angular'],
    Vue: ['vue', 'vuejs'],
    'Nuxt.js': ['nuxt'],
    Vite: ['vite'],
    Django: ['django'],
    Flask: ['flask'],
    FastAPI: ['fastapi'],
    Express: ['express', 'expressjs'],
    NestJS: ['nestjs', '@nestjs'],
    Spring: ['spring', 'springboot', 'spring-boot'],
    Laravel: ['laravel'],
    Rails: ['rails', 'ruby-on-rails'],
    'ASP.NET': ['asp.net', 'aspnet'],
    Flutter: ['flutter'],
    'React Native': ['react-native'],
    TensorFlow: ['tensorflow'],
    PyTorch: ['pytorch'],
    Kubernetes: ['kubernetes', 'k8s'],
    Docker: ['docker'],
    AWS: ['aws', 'amazon-web-services'],
    Azure: ['azure'],
    GCP: ['gcp', 'google-cloud'],
    MongoDB: ['mongodb', 'mongo'],
    PostgreSQL: ['postgresql', 'postgres'],
    MySQL: ['mysql'],
    Redis: ['redis'],
    Node: ['node.js', 'nodejs'],
    GraphQL: ['graphql'],
    Tailwind: ['tailwind', 'tailwindcss'],
    Bootstrap: ['bootstrap'],
    'Material-UI': ['material-ui', 'mui'],
  };

  private stackPatterns: { [key: string]: string[] } = {
    'MERN': ['MongoDB', 'Express', 'React', 'Node'],
    'MEAN': ['MongoDB', 'Express', 'Angular', 'Node'],
    'MEVN': ['MongoDB', 'Express', 'Vue', 'Node'],
    'PERN': ['PostgreSQL', 'Express', 'React', 'Node'],
    'LAMP': ['Linux', 'Apache', 'MySQL', 'PHP'],
    'Django Stack': ['Django', 'PostgreSQL', 'Python'],
    'Rails Stack': ['Rails', 'PostgreSQL', 'Ruby'],
    'JAMstack': ['JavaScript', 'API', 'Markup'],
    'T3 Stack': ['TypeScript', 'tRPC', 'Tailwind', 'Next.js'],
  };

  private techStackMapping: { [key: string]: string[] } = {
    'Frontend Developer': ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular'],
    'Backend Developer': ['Python', 'Java', 'Go', 'Node.js', 'Ruby', 'PHP', 'C#'],
    'Full Stack Developer': ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'Express'],
    'Mobile Developer': ['Swift', 'Kotlin', 'Java', 'Dart', 'Flutter', 'React Native'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'Python', 'Go', 'Shell', 'Terraform'],
    'Data Scientist': ['Python', 'R', 'SQL', 'TensorFlow', 'PyTorch', 'Jupyter'],
    'ML Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras'],
    'Cloud Engineer': ['AWS', 'Azure', 'GCP', 'Terraform', 'Docker', 'Kubernetes'],
    'Game Developer': ['C++', 'C#', 'Unity', 'Unreal Engine', 'Godot'],
    'Systems Programmer': ['C', 'C++', 'Rust', 'Go', 'Assembly'],
  };

  analyzeRepositories(
    user: GitHubUser,
    repos: RepositoryWithLanguages[],
    contributions?: ContributionStats,
  ): AnalysisResult {
    const skillAnalysis = this.analyzeSkills(user, repos);
    const highlights = this.extractRepositoryHighlights(repos, skillAnalysis.topLanguages.map((entry) => entry.language));
    const activity = this.calculateActivityMetrics(repos);
    const quality = this.evaluateQualitySignals(repos, activity);
    const opportunities = this.identifyOpportunities(skillAnalysis, quality, activity);
    const futurePrediction = this.predictFuture(skillAnalysis, quality, activity);
    const timeline = this.buildTimeline(user, repos, skillAnalysis);

    return {
      user,
      skillAnalysis,
      opportunities,
      futurePrediction,
      highlights,
      activity,
      quality,
      timeline,
      contributions,
    };
  }

  private analyzeSkills(user: GitHubUser, repos: RepositoryWithLanguages[]): SkillAnalysis {
    // Aggregate all languages
    const languageTotals: { [key: string]: number } = {};
    const frameworks = new Set<string>();
    const tools = new Set<string>();
    const detectedTech = new Set<string>();

    repos.forEach((repo) => {
      if (repo.languageStats) {
        Object.entries(repo.languageStats).forEach(([lang, bytes]) => {
          languageTotals[lang] = (languageTotals[lang] || 0) + (bytes as number);
        });
      }

      // Check for frameworks in topics, description, and repo name
      const searchText = [
        ...(repo.topics || []),
        repo.description || '',
        repo.name || '',
      ].join(' ').toLowerCase();

      Object.entries(this.frameworkKeywords).forEach(([framework, keywords]) => {
        if (keywords.some((keyword) => searchText.includes(keyword))) {
          frameworks.add(framework);
          detectedTech.add(framework);
        }
      });

      // Identify tools
      if (searchText.includes('docker')) {
        tools.add('Docker');
        detectedTech.add('Docker');
      }
      if (searchText.includes('kubernetes') || searchText.includes('k8s')) {
        tools.add('Kubernetes');
        detectedTech.add('Kubernetes');
      }
      if (searchText.includes('git')) tools.add('Git');
      if (searchText.includes('ci/cd') || searchText.includes('github-actions')) tools.add('CI/CD');
      if (searchText.includes('terraform')) {
        tools.add('Terraform');
        detectedTech.add('Terraform');
      }
      if (searchText.includes('ansible')) tools.add('Ansible');
    });

    // Calculate percentages
    const totalBytes = Object.values(languageTotals).reduce((a, b) => a + b, 0);
    const topLanguages = Object.entries(languageTotals)
      .map(([language, bytes]) => ({
        language,
        percentage: (bytes / totalBytes) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    // Add main languages to detected tech
    topLanguages.slice(0, 5).forEach(lang => detectedTech.add(lang.language));

    // Detect full stack patterns
    const detectedStacks = this.detectFullStacks(detectedTech);

    // Categorize languages
    const primary = topLanguages.slice(0, 3).map((l) => l.language);
    const secondary = topLanguages.slice(3, 6).map((l) => l.language);

    const techStack: TechStack = {
      primary: detectedStacks.length > 0 ? detectedStacks : primary,
      secondary,
      frameworks: Array.from(frameworks),
      tools: Array.from(tools),
    };

    const stackDepth = this.deriveStackDepth(techStack, repos);

    // Calculate experience level
    const accountAge = this.calculateAccountAge(user.created_at);
    const totalProjects = repos.length;
    const activeProjects = repos.filter((r) => this.isRecentlyActive(r.updated_at)).length;
    const avgStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0) / repos.length;

    const experienceLevel = this.determineExperienceLevel(
      accountAge,
      totalProjects,
      activeProjects,
      avgStars
    );

    return {
      techStack,
      topLanguages,
      experienceLevel,
      totalProjects,
      activeProjects,
      accountAge,
      stackDepth,
    };
  }

  private detectFullStacks(detectedTech: Set<string>): string[] {
    const stacks: string[] = [];
    const techArray = Array.from(detectedTech).map(t => t.toLowerCase());

    // Check for known stack patterns
    Object.entries(this.stackPatterns).forEach(([stackName, components]) => {
      const matches = components.filter(comp => 
        techArray.some(tech => 
          tech.includes(comp.toLowerCase()) || comp.toLowerCase().includes(tech)
        )
      );

      // If at least 3 out of 4 components match (or 2 out of 3 for smaller stacks)
      const threshold = components.length >= 4 ? 3 : 2;
      if (matches.length >= threshold) {
        stacks.push(stackName);
      }
    });

    // Detect common frontend stacks
    if (detectedTech.has('React')) {
      if (detectedTech.has('Vite')) stacks.push('React + Vite');
      else if (detectedTech.has('Next.js')) stacks.push('Next.js');
    }
    if (detectedTech.has('Vue') && detectedTech.has('Vite')) stacks.push('Vue + Vite');
    if (detectedTech.has('Angular')) stacks.push('Angular');
    
    // Detect backend stacks
    if (detectedTech.has('Node') || detectedTech.has('Express')) {
      if (detectedTech.has('TypeScript')) stacks.push('Node.js + TypeScript');
      else stacks.push('Node.js + Express');
    }
    if (detectedTech.has('Django')) stacks.push('Django');
    if (detectedTech.has('Spring')) stacks.push('Spring Boot');
    
    // Detect full-stack combinations
    const hasReact = detectedTech.has('React') || detectedTech.has('Next.js');
    const hasNode = detectedTech.has('Node') || detectedTech.has('Express');
    const hasMongo = detectedTech.has('MongoDB');
    const hasPostgres = detectedTech.has('PostgreSQL');
    
    if (hasReact && hasNode && !stacks.includes('MERN') && !stacks.includes('PERN')) {
      if (hasMongo) stacks.push('MERN Stack');
      else if (hasPostgres) stacks.push('PERN Stack');
    }

    return stacks.slice(0, 4); // Limit to top 4 stacks
  }

  private deriveStackDepth(techStack: TechStack, repos: RepositoryWithLanguages[]): StackDepth {
    const core = new Set<string>(techStack.primary.slice(0, 4));
    const supporting = new Set<string>();
    const emerging = new Set<string>();

    const frameworkUsage = new Map<string, number>();
    const recentFrameworks = new Set<string>();
    const recentCutoff = new Date();
    recentCutoff.setMonth(recentCutoff.getMonth() - 12);

    repos.forEach((repo) => {
      const searchText = [
        ...(repo.topics || []),
        repo.description || '',
        repo.name || '',
      ].join(' ').toLowerCase();

      Object.entries(this.frameworkKeywords).forEach(([framework, keywords]) => {
        if (keywords.some((keyword) => searchText.includes(keyword))) {
          frameworkUsage.set(framework, (frameworkUsage.get(framework) || 0) + 1);
          if (new Date(repo.updated_at) >= recentCutoff) {
            recentFrameworks.add(framework);
          }
        }
      });
    });

    frameworkUsage.forEach((count, framework) => {
      if (count >= 2) {
        core.add(framework);
      } else {
        supporting.add(framework);
      }
    });

    techStack.secondary.forEach((item) => supportsIfAbsent(item, core, supporting));
    techStack.tools.forEach((tool) => supportsIfAbsent(tool, core, supporting));

    recentFrameworks.forEach((framework) => {
      if (!core.has(framework) && !supporting.has(framework)) {
        emerging.add(framework);
      }
    });

    // Emerging languages detected in repositories created or updated within the past year
    repos.forEach((repo) => {
      const updatedRecently = new Date(repo.updated_at) >= recentCutoff || new Date(repo.created_at) >= recentCutoff;
      if (!updatedRecently || !repo.language) return;

      const language = repo.language;
      if (!core.has(language) && !supporting.has(language)) {
        emerging.add(language);
      }
    });

    return {
      core: Array.from(core),
      supporting: Array.from(supporting).filter((item) => !core.has(item)),
      emerging: Array.from(emerging),
    };

    function supportsIfAbsent(value: string, coreSet: Set<string>, supportingSet: Set<string>) {
      if (!coreSet.has(value)) {
        supportingSet.add(value);
      }
    }
  }

  private extractRepositoryHighlights(
    repos: RepositoryWithLanguages[],
    priorityLanguages: string[],
  ): RepositoryHighlight[] {
    if (!repos.length) return [];

    const highlights: RepositoryHighlight[] = [];
    const seen = new Set<string>();
    const byStars = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
    const byRecency = [...repos].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    const addHighlight = (repo: RepositoryWithLanguages | undefined, reason: string) => {
      if (!repo || seen.has(repo.name)) return;
      highlights.push({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        primaryLanguage: repo.language,
        lastUpdated: repo.updated_at,
        createdAt: repo.created_at,
        topics: repo.topics || [],
        url: repo.html_url,
        reason,
      });
      seen.add(repo.name);
    };

    addHighlight(byStars[0], 'Top starred');

    const recentStandout = byRecency.find((repo) => repo.stargazers_count >= 5) || byRecency[0];
    addHighlight(recentStandout, 'Recent');

    const stackAligned = byStars.find((repo) =>
      priorityLanguages.some((language) =>
        (repo.language || '').toLowerCase() === language.toLowerCase() ||
        Object.keys(repo.languageStats || {}).some((lang) => lang.toLowerCase() === language.toLowerCase()),
      ),
    );
    addHighlight(stackAligned, 'Core stack');

    let index = 0;
    while (highlights.length < Math.min(3, repos.length)) {
      addHighlight(byStars[index], 'Popular');
      index += 1;
      if (index >= byStars.length) break;
    }

    return highlights;
  }

  private calculateActivityMetrics(repos: RepositoryWithLanguages[]): ActivityMetrics {
    if (!repos.length) {
      return {
        recentPushes: 0,
        activeLast30Days: 0,
        activeLast90Days: 0,
        medianUpdateInterval: 90,
        longestQuietStreak: 0,
        velocityScore: 0,
      };
    }

    const now = new Date();
    const dayMs = 1000 * 60 * 60 * 24;
    const diffDays = (date: string) => Math.round((now.getTime() - new Date(date).getTime()) / dayMs);

    const sortedByUpdate = [...repos].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    const intervals: number[] = [];
    for (let i = 0; i < sortedByUpdate.length - 1; i += 1) {
      const current = new Date(sortedByUpdate[i].updated_at);
      const next = new Date(sortedByUpdate[i + 1].updated_at);
      intervals.push(Math.round(Math.abs(current.getTime() - next.getTime()) / dayMs));
    }

    const recentPushes = sortedByUpdate.filter((repo) => diffDays(repo.updated_at) <= 14).length;
    const activeLast30Days = sortedByUpdate.filter((repo) => diffDays(repo.updated_at) <= 30).length;
    const activeLast90Days = sortedByUpdate.filter((repo) => diffDays(repo.updated_at) <= 90).length;

    const medianUpdateInterval = intervals.length
      ? this.median(intervals)
      : diffDays(sortedByUpdate[0].updated_at);

    const longestQuietStreak = intervals.length
      ? Math.max(...intervals, diffDays(sortedByUpdate[0].updated_at))
      : diffDays(sortedByUpdate[0].updated_at);

    const velocityBase = activeLast30Days * 12 + activeLast90Days * 6 + recentPushes * 16;
    const velocityPenalty = Math.max(0, Math.min(30, Math.floor(longestQuietStreak / 30) * 8));
    const velocityScore = Math.max(5, Math.min(100, velocityBase - velocityPenalty));

    return {
      recentPushes,
      activeLast30Days,
      activeLast90Days,
      medianUpdateInterval,
      longestQuietStreak,
      velocityScore,
    };
  }

  private evaluateQualitySignals(
    repos: RepositoryWithLanguages[],
    activity: ActivityMetrics,
  ): QualitySignals {
    if (!repos.length) {
      return {
        testing: 'Sparse',
        automation: 'None',
        documentation: 'Sparse',
        releaseCadence: 'Ad-hoc',
        notes: ['No public repositories available for analysis.'],
      };
    }

    const total = repos.length;
    let testingHits = 0;
    let automationHits = 0;
    let documentationHits = 0;

    repos.forEach((repo) => {
      const text = [
        ...(repo.topics || []),
        repo.description || '',
        repo.name || '',
      ].join(' ').toLowerCase();

      if (['test', 'spec', 'jest', 'pytest', 'cypress', 'vitest', 'mocha', 'unit'].some((key) => text.includes(key))) {
        testingHits += 1;
      }

      if (
        [
          'github-actions',
          'workflow',
          'ci',
          'pipeline',
          'continuous',
          'deployment',
          'travis',
          'circleci',
          'azure-pipelines',
          'gitlab-ci',
        ].some((key) => text.includes(key))
      ) {
        automationHits += 1;
      }

      if (
        (repo.description && repo.description.length > 80) ||
        ['docs', 'documentation', 'wiki', 'guide', 'handbook', 'storybook', 'readme'].some((key) => text.includes(key))
      ) {
        documentationHits += 1;
      }
    });

    const testingRatio = testingHits / total;
    const automationRatio = automationHits / total;
    const documentationRatio = documentationHits / total;

    const testing: QualitySignals['testing'] = testingRatio >= 0.35
      ? 'Strong'
      : testingRatio >= 0.18
        ? 'Moderate'
        : 'Sparse';

    const automation: QualitySignals['automation'] = automationRatio >= 0.3
      ? 'Advanced'
      : automationRatio >= 0.15
        ? 'Basic'
        : 'None';

    const documentation: QualitySignals['documentation'] = documentationRatio >= 0.45
      ? 'Comprehensive'
      : documentationRatio >= 0.2
        ? 'Moderate'
        : 'Sparse';

    const releaseCadence = this.cadenceFromInterval(activity.medianUpdateInterval);

    const notes: string[] = [];
    if (testing === 'Sparse') notes.push('Testing references are minimal across public repositories.');
    if (automation === 'None') notes.push('No CI/CD or workflow keywords detected; consider adding automation.');
    if (documentation === 'Sparse') notes.push('Documentation signals are limited; enrich READMEs and guides.');
    if (activity.recentPushes >= 5) notes.push('Multiple repositories updated in the last two weeks.');
    if (activity.velocityScore >= 70) notes.push('Development cadence is consistently high.');

    return {
      testing,
      automation,
      documentation,
      releaseCadence,
      notes,
    };
  }

  private identifyOpportunities(
    skillAnalysis: SkillAnalysis,
    quality: QualitySignals,
    activity: ActivityMetrics,
  ): Opportunities {
    const jobRoles = new Set<string>();
    const industries = new Set<string>();
    const recommendations: string[] = [];
    const nextActions: string[] = [];

    const { primary, frameworks, tools } = skillAnalysis.techStack;

    // Match tech stack to job roles
    Object.entries(this.techStackMapping).forEach(([role, requiredSkills]) => {
      const matches = requiredSkills.filter(
        (skill) =>
          primary.includes(skill) ||
          frameworks.includes(skill) ||
          tools.includes(skill) ||
          primary.some((p) => skill.toLowerCase().includes(p.toLowerCase()))
      );

      if (matches.length >= 2) {
        jobRoles.add(role);
      }
    });

    // Industry recommendations
    if (frameworks.some((f) => ['React', 'Angular', 'Vue'].includes(f))) {
      industries.add('Web Development');
      industries.add('SaaS');
    }
    if (frameworks.some((f) => ['TensorFlow', 'PyTorch'].includes(f))) {
      industries.add('AI/ML');
      industries.add('Data Science');
    }
    if (tools.some((t) => ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP'].includes(t))) {
      industries.add('Cloud Computing');
      industries.add('DevOps');
    }
    if (primary.some((p) => ['Swift', 'Kotlin', 'Dart'].includes(p))) {
      industries.add('Mobile Apps');
    }
    if (frameworks.some((f) => ['Django', 'Flask', 'Express', 'Spring'].includes(f))) {
      industries.add('Backend Services');
      industries.add('API Development');
    }

    // Generate recommendations
    if (skillAnalysis.experienceLevel === 'Beginner') {
      recommendations.push('Expand project variety to demonstrate breadth and foundational skills.');
      recommendations.push('Join collaborative open-source repositories to grow teamwork experience.');
      nextActions.push('Ship a small production-ready project end-to-end this month.');
    } else if (skillAnalysis.experienceLevel === 'Intermediate') {
      recommendations.push('Deepen expertise in flagship stack components through advanced builds.');
      recommendations.push('Take on architectural responsibilities in collaborative projects.');
      nextActions.push('Document design decisions and publish a technical case study.');
    } else {
      recommendations.push('Share expertise via mentorship, talks, or open-source leadership.');
      recommendations.push('Lean into architecture and scaling concerns across flagship repos.');
      nextActions.push('Formalize long-term roadmap for your most active repositories.');
    }

    if (skillAnalysis.activeProjects < 3) {
      nextActions.push('Increase public project cadence to highlight ongoing maintenance.');
    }

    if (quality.testing === 'Sparse') {
      nextActions.push('Introduce automated test coverage on highlighted repositories.');
    }

    if (quality.automation === 'None') {
      nextActions.push('Set up a CI/CD workflow (GitHub Actions, CircleCI, or similar).');
    }

    if (quality.documentation === 'Sparse') {
      nextActions.push('Upgrade README and docs with architecture notes and usage guides.');
    }

    if (activity.velocityScore < 40) {
      nextActions.push('Plan bi-weekly release checkpoints to increase visible momentum.');
    }

    const dedupe = (values: string[]) => Array.from(new Set(values));

    return {
      jobRoles: dedupe(Array.from(jobRoles)),
      industries: dedupe(Array.from(industries)),
      recommendations: dedupe(recommendations),
      nextActions: dedupe(nextActions),
    };
  }

  private predictFuture(
    skillAnalysis: SkillAnalysis,
    quality: QualitySignals,
    activity: ActivityMetrics,
  ): FuturePrediction {
    const growthAreas: string[] = [];
    const skillsToLearn: string[] = [];
    const careerPath: string[] = [];
    let marketDemand: 'Low' | 'Medium' | 'High' | 'Very High' = 'Medium';

    const { primary, frameworks, tools } = skillAnalysis.techStack;

    if (activity.velocityScore >= 70 || quality.automation === 'Advanced') {
      marketDemand = 'Very High';
    } else if (activity.velocityScore >= 50) {
      marketDemand = 'High';
    }

    // Growth areas based on current stack
    if (primary.includes('JavaScript') || primary.includes('TypeScript')) {
      growthAreas.push('Web3 and Blockchain Development');
      growthAreas.push('Progressive Web Apps');
      skillsToLearn.push('WebAssembly', 'GraphQL', 'TypeScript (if not already)');
    }

    if (primary.includes('Python')) {
      growthAreas.push('AI and Machine Learning');
      growthAreas.push('Data Engineering');
      skillsToLearn.push('TensorFlow/PyTorch', 'Apache Spark', 'MLOps');
      marketDemand = marketDemand === 'Very High' ? 'Very High' : 'High';
    }

    if (tools.includes('Docker') || tools.includes('Kubernetes')) {
      growthAreas.push('Cloud Native Development');
      growthAreas.push('Platform Engineering');
      skillsToLearn.push('Service Mesh (Istio)', 'GitOps (ArgoCD)', 'eBPF');
      marketDemand = 'Very High';
    }

    if (frameworks.some((f) => ['React', 'Vue', 'Angular'].includes(f))) {
      growthAreas.push('Frontend Architecture');
      skillsToLearn.push('Micro-frontends', 'Server Components', 'Edge Computing');
      if (marketDemand !== 'Very High') {
        marketDemand = 'High';
      }
    }

    // Universal growth areas
    if (!growthAreas.length) {
      growthAreas.push('Cloud Computing', 'DevOps', 'Automation');
    }

    // Career path based on experience
    if (skillAnalysis.experienceLevel === 'Beginner') {
      careerPath.push('Junior Developer (0-2 years)');
      careerPath.push('Mid-level Developer (2-4 years)');
      careerPath.push('Senior Developer (4-7 years)');
    } else if (skillAnalysis.experienceLevel === 'Intermediate') {
      careerPath.push('Senior Developer (current)');
      careerPath.push('Tech Lead / Staff Engineer (2-3 years)');
      careerPath.push('Principal Engineer / Architect (5+ years)');
    } else {
      careerPath.push('Tech Lead / Staff Engineer (current)');
      careerPath.push('Principal Engineer (2-3 years)');
      careerPath.push('Distinguished Engineer / CTO (5+ years)');
    }

    // Add universal skills to learn
    if (!skillsToLearn.includes('System Design')) {
      skillsToLearn.push('System Design', 'Cloud Architecture', 'Security Best Practices');
    }

    const dedupe = (values: string[]) => Array.from(new Set(values));

    return {
      growthAreas: dedupe(growthAreas),
      skillsToLearn: dedupe(skillsToLearn),
      careerPath,
      marketDemand,
    };
  }

  private buildTimeline(
    user: GitHubUser,
    repos: RepositoryWithLanguages[],
    skillAnalysis: SkillAnalysis,
  ): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const accountCreated = new Date(user.created_at);
    events.push({
      year: accountCreated.getFullYear(),
      title: 'Joined GitHub',
      description: `Account created • ${skillAnalysis.totalProjects} public repositories analysed`,
    });

    if (!repos.length) {
      return events;
    }

    const byCreation = [...repos].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const firstRepo = byCreation[0];
    events.push({
      year: new Date(firstRepo.created_at).getFullYear(),
      title: `First repository • ${firstRepo.name}`,
      description: firstRepo.description || 'Initial project committed to GitHub',
    });

    skillAnalysis.topLanguages.slice(0, 3).forEach((lang) => {
      const match = byCreation.find((repo) => {
        if (!repo) return false;
        if ((repo.language || '').toLowerCase() === lang.language.toLowerCase()) return true;
        return Object.keys(repo.languageStats || {}).some(
          (language) => language.toLowerCase() === lang.language.toLowerCase(),
        );
      });

      if (match) {
        events.push({
          year: new Date(match.created_at).getFullYear(),
          title: `${lang.language} adoption`,
          description: `${match.name} introduced ${lang.language} into the portfolio`,
        });
      }
    });

    const latestRepo = [...repos].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )[0];
    events.push({
      year: new Date(latestRepo.updated_at).getFullYear(),
      title: 'Latest launch',
      description: `${latestRepo.name} updated ${this.timeSince(latestRepo.updated_at)} ago`,
    });

    return events
      .sort((a, b) => a.year - b.year)
      .reduce<TimelineEvent[]>((acc, event) => {
        const key = `${event.year}-${event.title}`;
        if (!acc.some((existing) => `${existing.year}-${existing.title}` === key)) {
          acc.push(event);
        }
        return acc;
      }, []);
  }

  private calculateAccountAge(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const years = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.round(years * 10) / 10;
  }

  private isRecentlyActive(updatedAt: string): boolean {
    const updated = new Date(updatedAt);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return updated > sixMonthsAgo;
  }

  private determineExperienceLevel(
    accountAge: number,
    totalProjects: number,
    activeProjects: number,
    avgStars: number
  ): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
    let score = 0;

    // Stricter account age scoring (elite devs have 5+ years)
    if (accountAge >= 7) score += 4;
    else if (accountAge >= 5) score += 3;
    else if (accountAge >= 3) score += 2;
    else if (accountAge >= 1) score += 1;

    // Stricter projects scoring (elite devs have 100+ quality repos)
    if (totalProjects >= 100) score += 4;
    else if (totalProjects >= 50) score += 3;
    else if (totalProjects >= 20) score += 2;
    else if (totalProjects >= 10) score += 1;

    // Activity scoring (elite devs maintain 20+ active projects)
    if (activeProjects >= 20) score += 3;
    else if (activeProjects >= 10) score += 2;
    else if (activeProjects >= 5) score += 1;

    // Stars scoring (elite devs average 50+ stars, have viral repos)
    if (avgStars >= 100) score += 4;
    else if (avgStars >= 50) score += 3;
    else if (avgStars >= 20) score += 2;
    else if (avgStars >= 5) score += 1;

    // Elite: 12+ (top 1% cadence and impact)
    // Expert: 9-11 (top 5% output and stewardship)
    // Advanced: 6-8 (solid mid-level)
    // Intermediate: 3-5 (junior to mid)
    // Beginner: 0-2 (entry level)

    if (score >= 12) return 'Expert';
    if (score >= 9) return 'Advanced';
    if (score >= 6) return 'Intermediate';
    return 'Beginner';
  }

  private median(values: number[]): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  private cadenceFromInterval(interval: number): QualitySignals['releaseCadence'] {
    if (interval <= 14) return 'Weekly';
    if (interval <= 30) return 'Biweekly';
    if (interval <= 60) return 'Monthly';
    if (interval <= 120) return 'Quarterly';
    return 'Ad-hoc';
  }

  private timeSince(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    const diffWeeks = Math.round(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks} wks`;
    const diffMonths = Math.round(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} mo`;
    const diffYears = Math.round(diffDays / 365);
    return `${diffYears} yr${diffYears > 1 ? 's' : ''}`;
  }
}
