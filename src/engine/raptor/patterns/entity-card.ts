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
    html: `<!-- Entity card styles for {{entityName}} -->`,
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
// Entity card renderer for {{entityId}}
function renderEntityCard(item, entityId) {
  var html = '<div class="entity-card" data-id="' + item.id + '">';
  html += '<div class="entity-card-header">';
  html += '<span class="entity-card-title">' + (item.name || item.title || 'Item') + '</span>';
  html += '</div>';
  html += '<div class="entity-card-body">';
  for (var key in item) {
    if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
      html += '<div class="entity-card-field">';
      html += '<span class="entity-card-label">' + key + '</span>';
      html += '<span>' + (item[key] || '-') + '</span>';
      html += '</div>';
    }
  }
  html += '</div>';
  html += '<div class="entity-card-actions">';
  html += '<button class="btn btn-danger btn-sm" onclick="deleteItem(\\'' + entityId + '\\', \\'' + item.id + '\\')">Delete</button>';
  html += '</div>';
  html += '</div>';
  return html;
}

function deleteItem(entityId, itemId) {
  if (confirm('Delete this item?')) {
    StateManager.delete(entityId, itemId);
    // Trigger re-render by dispatching event
    document.dispatchEvent(new CustomEvent('dataChanged', { detail: { entityId: entityId } }));
  }
}
`,
  },
  dependencies: ['style-base'],
};

export default entityCard;
