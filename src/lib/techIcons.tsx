// Tech icon mapping using SVG files from assets
const techIconMap: Record<string, string> = {
  // Languages
  'JavaScript': '/src/assets/images/JavaScript.svg',
  'TypeScript': '/src/assets/images/TypeScript.svg',
  'Python': '/src/assets/images/Python.svg',
  'Java': '/src/assets/images/Java.svg',
  'Go': '/src/assets/images/Go.svg',
  'Rust': '/src/assets/images/Rust.svg',
  'PHP': '/src/assets/images/PHP.svg',
  'Ruby': '/src/assets/images/Ruby.svg',
  'C++': '/src/assets/images/C++.svg',
  'C#': '/src/assets/images/C%23.svg',
  'Swift': '/src/assets/images/Swift.svg',
  'Kotlin': '/src/assets/images/Kotlin.svg',
  'Dart': '/src/assets/images/Dart.svg',
  'HTML': '/src/assets/images/HTML5.svg',
  'CSS': '/src/assets/images/CSS3.svg',
  'C': '/src/assets/images/C.svg',
  'R': '/src/assets/images/R.svg',
  'Scala': '/src/assets/images/Scala.svg',
  'Perl': '/src/assets/images/Perl.svg',
  'Lua': '/src/assets/images/Lua.svg',
  
  // Frontend Frameworks
  'React': '/src/assets/images/React.svg',
  'Next.js': '/src/assets/images/Next.js.svg',
  'Vue': '/src/assets/images/Vue.js.svg',
  'Angular': '/src/assets/images/Angular.svg',
  'Svelte': '/src/assets/images/Svelte.svg',
  'Vite': '/src/assets/images/Vite.js.svg',
  'Gatsby': '/src/assets/images/Gatsby.svg',
  'Nuxt.js': '/src/assets/images/Nuxt.js.svg',
  'Ember': '/src/assets/images/Ember.svg',
  
  // Backend Frameworks
  'Django': '/src/assets/images/Django.svg',
  'Flask': '/src/assets/images/Flask.svg',
  'FastAPI': '/src/assets/images/FastAPI.svg',
  'Express': '/src/assets/images/Express.svg',
  'NestJS': '/src/assets/images/NestJS.svg',
  'Spring': '/src/assets/images/Spring.svg',
  'Laravel': '/src/assets/images/Laravel.svg',
  'Rails': '/src/assets/images/Rails.svg',
  'Node': '/src/assets/images/Node.js.svg',
  'ASP.NET': '/src/assets/images/dotNET.svg',
  
  // Databases
  'MongoDB': '/src/assets/images/MongoDB.svg',
  'PostgreSQL': '/src/assets/images/PostgresSQL.svg',
  'MySQL': '/src/assets/images/MySQL.svg',
  'Redis': '/src/assets/images/Redis.svg',
  'SQLite': '/src/assets/images/SQLite.svg',
  'MariaDB': '/src/assets/images/MariaDB.svg',
  'Oracle': '/src/assets/images/Oracle.svg',
  
  // DevOps & Tools
  'Docker': '/src/assets/images/Docker.svg',
  'Kubernetes': '/src/assets/images/Kubernetes.svg',
  'Git': '/src/assets/images/Git.svg',
  'AWS': '/src/assets/images/AWS.svg',
  'Azure': '/src/assets/images/Azure.svg',
  'GCP': '/src/assets/images/Google-Cloud.svg',
  'Jenkins': '/src/assets/images/Jenkins.svg',
  'GitHub': '/src/assets/images/Github.svg',
  'GitLab': '/src/assets/images/GitLab.svg',
  
  // UI Libraries
  'Tailwind': '/src/assets/images/Tailwind-CSS.svg',
  'Bootstrap': '/src/assets/images/Bootstrap.svg',
  'Material-UI': '/src/assets/images/Material-UI.svg',
  'Sass': '/src/assets/images/Sass.svg',
  
  // Mobile
  'Flutter': '/src/assets/images/Flutter.svg',
  'React Native': '/src/assets/images/React.svg',
  
  // Other
  'GraphQL': '/src/assets/images/GraphQL.svg',
  'TensorFlow': '/src/assets/images/TensorFlow.svg',
  'PyTorch': '/src/assets/images/PyTorch.svg',
  'Webpack': '/src/assets/images/Webpack.svg',
  'Babel': '/src/assets/images/Babel.svg',
  'Redux': '/src/assets/images/Redux.svg',
  'Nginx': '/src/assets/images/Nginx.svg',
}

export const getTechIcon = (techName: string): string => {
  // Try exact match
  if (techIconMap[techName]) return techIconMap[techName]
  
  // Try case-insensitive match
  const lowerTech = techName.toLowerCase()
  const match = Object.keys(techIconMap).find(key => 
    key.toLowerCase() === lowerTech || 
    lowerTech.includes(key.toLowerCase()) ||
    key.toLowerCase().includes(lowerTech)
  )
  
  if (match) return techIconMap[match]
  
  // Default fallback
  return '/src/assets/images/Code.svg'
}
