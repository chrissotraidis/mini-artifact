import { Pattern } from '../../../types';

/**
 * View List Pattern (Simplified)
 * 
 * Generates HTML only - all JS logic handled by app-core pattern.
 * Uses data attributes for app-core to hook into.
 */
export const viewList: Pattern = {
  id: 'view-list',
  name: 'List View',
  description: 'Table/list display for entity collections',
  category: 'view',
  inputs: [
    { name: 'viewId', type: 'string', required: true },
    { name: 'viewName', type: 'string', required: true },
    { name: 'entity', type: 'object', required: true },
  ],
  template: {
    html: `
<div id="{{viewId}}" class="view" style="display: none;">
  <div class="view-header">
    <h2>{{viewName}}</h2>
    <button class="btn btn-primary" data-add-entity="{{entity.id}}">
      + Add {{entity.name}}
    </button>
  </div>
  
  <div class="view-content">
    <div id="{{entity.id}}-list" class="item-list">
      <!-- Items rendered by App.renderList() -->
    </div>
    
    <div id="{{entity.id}}-empty" class="empty-state">
      <p class="text-muted">No {{pluralize entity.name}} yet. Click the button above to add one.</p>
    </div>
  </div>
</div>`,
    css: `
.view {
  padding: 1.5rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.view-content {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1rem;
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-prop {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}
`,
    js: '', // All JS handled by app-core
  },
  dependencies: ['style-base', 'app-core'],
};

export default viewList;
