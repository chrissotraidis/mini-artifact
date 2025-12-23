import { Pattern } from '../../../types';

export const entityCard: Pattern = {
    id: 'entity-card',
    name: 'Entity Card',
    description: 'Card component for entity display',
    category: 'entity',
    inputs: [
        { name: 'entityId', type: 'string', required: true },
        { name: 'entityName', type: 'string', required: true },
        { name: 'properties', type: 'object[]', required: true },
    ],
    template: {
        html: `<!-- Entity card template for {{entityName}} -->`,
        css: `
.entity-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1rem;
  transition: all 0.15s ease;
}

.entity-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.entity-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.entity-card-title {
  font-weight: 600;
  font-size: 1rem;
}

.entity-card-body {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.entity-card-field {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.entity-card-label {
  color: var(--color-text-muted);
}

.entity-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}
`,
        js: `
function render{{capitalize entityId}}Card(item) {
  return \`
    <div class="entity-card" data-id="\${item.id}">
      <div class="entity-card-header">
        <span class="entity-card-title">\${item.{{properties.[0].name}} || 'Unnamed'}</span>
      </div>
      <div class="entity-card-body">
        {{#each properties}}
        {{#unless @first}}
        <div class="entity-card-field">
          <span class="entity-card-label">{{capitalize name}}</span>
          <span>\${item.{{name}} || '-'}</span>
        </div>
        {{/unless}}
        {{/each}}
      </div>
      <div class="entity-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="showDetail('{{entityId}}', '\${item.id}')">View</button>
        <button class="btn btn-secondary btn-sm" onclick="edit{{capitalize entityId}}('\${item.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="delete{{capitalize entityId}}('\${item.id}')">Delete</button>
      </div>
    </div>
  \`;
}
`,
    },
    dependencies: ['style-base'],
};

export default entityCard;
