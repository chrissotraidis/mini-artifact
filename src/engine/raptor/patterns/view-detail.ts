import { Pattern } from '../../../types';

export const viewDetail: Pattern = {
    id: 'view-detail',
    name: 'Detail View',
    description: 'Single item detail display',
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
    <button class="btn btn-secondary" onclick="goBackToList('{{entity.id}}')">← Back to List</button>
  </div>
  
  <div class="detail-container" id="{{entity.id}}-detail">
    <div class="detail-card">
      {{#each properties}}
      <div class="detail-row">
        <span class="detail-label">{{capitalize name}}</span>
        <span class="detail-value" id="{{../entity.id}}-detail-{{name}}">-</span>
      </div>
      {{/each}}
      
      <div class="detail-actions">
        <button class="btn btn-primary" onclick="editFromDetail('{{entity.id}}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteFromDetail('{{entity.id}}')">Delete</button>
      </div>
    </div>
  </div>
</div>`,
        css: `
.detail-container {
  max-width: 600px;
}

.detail-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-row:last-of-type {
  border-bottom: none;
}

.detail-label {
  flex: 0 0 150px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.detail-value {
  flex: 1;
}

.detail-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
`,
        js: `
let current{{capitalize entity.id}}Id = null;

function showDetail(entityId, itemId) {
  const item = StateManager.getById(entityId, itemId);
  if (!item) return;
  
  current{{capitalize entity.id}}Id = itemId;
  
  // Populate detail values
  {{#each properties}}
  const {{name}}El = document.getElementById('{{../entity.id}}-detail-{{name}}');
  if ({{name}}El) {
    {{#if (eq type "boolean")}}
    {{name}}El.textContent = item.{{name}} ? 'Yes' : 'No';
    {{else if (eq type "date")}}
    {{name}}El.textContent = item.{{name}} ? new Date(item.{{name}}).toLocaleDateString() : '-';
    {{else}}
    {{name}}El.textContent = item.{{name}} || '-';
    {{/if}}
  }
  {{/each}}
  
  showView('{{entity.id}}-detail-view');
}

function goBackToList(entityId) {
  current{{capitalize entity.id}}Id = null;
  const listView = document.querySelector('[data-view$="-list"]');
  if (listView) listView.click();
}

function editFromDetail(entityId) {
  if (current{{capitalize entity.id}}Id) {
    const item = StateManager.getById(entityId, current{{capitalize entity.id}}Id);
    if (item) {
      showEditForm(entityId, item);
    }
  }
}

function deleteFromDetail(entityId) {
  if (current{{capitalize entity.id}}Id && confirm('Are you sure you want to delete this?')) {
    StateManager.delete(entityId, current{{capitalize entity.id}}Id);
    goBackToList(entityId);
    render{{capitalize entity.id}}List();
  }
}
`,
    },
    dependencies: ['style-base', 'state-manager'],
};

export default viewDetail;
