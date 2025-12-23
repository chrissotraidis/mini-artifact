import { Pattern } from '../../../types';

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
    <a href="#{{id}}" class="navbar-link" data-view="{{id}}">{{name}}</a>
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
  transition: all 0.15s ease;
}

.navbar-link:hover,
.navbar-link.active {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  text-decoration: none;
}
`,
        js: `
// Navigation handler
document.querySelectorAll('.navbar-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const viewId = e.target.dataset.view;
    showView(viewId);
    
    // Update active state
    document.querySelectorAll('.navbar-link').forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');
  });
});

function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
  });
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove('hidden');
  }
}

// Show first view by default
document.addEventListener('DOMContentLoaded', () => {
  const firstLink = document.querySelector('.navbar-link');
  if (firstLink) {
    firstLink.click();
  }
});
`,
    },
    dependencies: ['style-base'],
};

export default navigation;
