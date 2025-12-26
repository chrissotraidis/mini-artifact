import { Pattern } from '../../../types';

/**
 * Navigation Pattern (Simplified)
 * 
 * Generates navigation HTML only - all JS logic handled by app-core pattern.
 * Uses data attributes for app-core to hook into.
 */
export const navigation: Pattern = {
  id: 'navigation',
  name: 'Navigation',
  description: 'Top navigation bar with app name and view links',
  category: 'layout',
  inputs: [
    { name: 'appName', type: 'string', required: true },
    { name: 'views', type: 'object[]', required: true },
  ],
  template: {
    html: `
<nav class="navbar">
  <div class="navbar-brand">
    <span class="navbar-logo">📦</span>
    <span class="navbar-title">{{appName}}</span>
  </div>
  <div class="navbar-links">
    {{#each views}}
    <a href="#" class="navbar-link" data-view="{{id}}">{{name}}</a>
    {{/each}}
  </div>
</nav>`,
    css: `
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-logo {
  font-size: 1.25rem;
}

.navbar-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.navbar-links {
  display: flex;
  gap: 0.5rem;
}

.navbar-link {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  border-radius: var(--radius);
  text-decoration: none;
  transition: all 0.15s ease;
}

.navbar-link:hover,
.navbar-link.active {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}
`,
    js: '', // All JS handled by app-core
  },
  dependencies: ['style-base'],
};

export default navigation;
