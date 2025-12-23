import { Pattern } from '../../../types';

export const viewList: Pattern = {
    id: 'view-list',
    name: 'List View',
    description: 'Table/list display for entity collections',
    category: 'view',
    inputs: [
        { name: 'viewId', type: 'string', required: true },
        { name: 'viewName', type: 'string', required: true },
        { name: 'entity', type: 'object', required: true },
        { name: 'properties', type: 'object[]', required: true },
    ],
    template: {
        html: `
<div id="{{viewId}}" class="view hidden">
  <div class="view-header">
    <h2>{{viewName}}</h2>
    <button class="btn btn-primary" onclick="showAddForm('{{entity.id}}')">
      + Add {{entity.name}}
    </button>
  </div>
  
  <div class="view-content">
    <table class="table">
      <thead>
        <tr>
          {{#each properties}}
          <th>{{capitalize name}}</th>
          {{/each}}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="{{entity.id}}-list">
        <!-- Items rendered by JS -->
      </tbody>
    </table>
    
    <div id="{{entity.id}}-empty" class="empty-state hidden">
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
  overflow: hidden;
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
`,
        js: `
// Render list for {{entity.id}}
function render{{capitalize entity.id}}List() {
  const items = StateManager.getAll('{{entity.id}}');
  const listEl = document.getElementById('{{entity.id}}-list');
  const emptyEl = document.getElementById('{{entity.id}}-empty');
  
  if (items.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  
  emptyEl.classList.add('hidden');
  listEl.innerHTML = items.map(item => \`
    <tr data-id="\${item.id}">
      {{#each properties}}
      <td>\${item.{{name}} || '-'}</td>
      {{/each}}
      <td class="item-actions">
        <button class="btn btn-secondary btn-sm" onclick="edit{{capitalize ../entity.id}}('\${item.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="delete{{capitalize ../entity.id}}('\${item.id}')">Delete</button>
      </td>
    </tr>
  \`).join('');
}

function delete{{capitalize entity.id}}(id) {
  if (confirm('Are you sure you want to delete this {{entity.name}}?')) {
    StateManager.delete('{{entity.id}}', id);
    render{{capitalize entity.id}}List();
  }
}

function edit{{capitalize entity.id}}(id) {
  const item = StateManager.getById('{{entity.id}}', id);
  if (item) {
    showEditForm('{{entity.id}}', item);
  }
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  render{{capitalize entity.id}}List();
});
`,
    },
    dependencies: ['style-base', 'state-manager'],
};

export default viewList;
