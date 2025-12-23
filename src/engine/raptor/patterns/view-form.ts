import { Pattern } from '../../../types';

export const viewForm: Pattern = {
    id: 'view-form',
    name: 'Form View',
    description: 'Create/edit form with input fields',
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
  </div>
  
  <div class="form-container">
    <form id="{{entity.id}}-form" class="form" onsubmit="handle{{capitalize entity.id}}Submit(event)">
      <input type="hidden" id="{{entity.id}}-edit-id">
      
      {{#each properties}}
      <div class="form-group">
        <label class="form-label" for="{{../entity.id}}-{{name}}">
          {{capitalize name}}{{#if required}} *{{/if}}
        </label>
        {{#if (eq type "boolean")}}
        <input 
          type="checkbox" 
          id="{{../entity.id}}-{{name}}" 
          name="{{name}}"
          class="form-checkbox"
        >
        {{else if (eq type "date")}}
        <input 
          type="date" 
          id="{{../entity.id}}-{{name}}" 
          name="{{name}}"
          class="form-input"
          {{#if required}}required{{/if}}
        >
        {{else if (eq type "number")}}
        <input 
          type="number" 
          id="{{../entity.id}}-{{name}}" 
          name="{{name}}"
          class="form-input"
          {{#if required}}required{{/if}}
        >
        {{else if (eq type "enum")}}
        <select 
          id="{{../entity.id}}-{{name}}" 
          name="{{name}}"
          class="form-input"
          {{#if required}}required{{/if}}
        >
          <option value="">Select...</option>
          {{#each options}}
          <option value="{{this}}">{{this}}</option>
          {{/each}}
        </select>
        {{else}}
        <input 
          type="text" 
          id="{{../entity.id}}-{{name}}" 
          name="{{name}}"
          class="form-input"
          placeholder="Enter {{name}}"
          {{#if required}}required{{/if}}
        >
        {{/if}}
      </div>
      {{/each}}
      
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="cancelForm('{{entity.id}}')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save {{entity.name}}</button>
      </div>
    </form>
  </div>
</div>`,
        css: `
.form-container {
  max-width: 500px;
}

.form {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.form-checkbox {
  width: 1.25rem;
  height: 1.25rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
`,
        js: `
function handle{{capitalize entity.id}}Submit(event) {
  event.preventDefault();
  const form = event.target;
  const editId = document.getElementById('{{entity.id}}-edit-id').value;
  
  const data = {
    {{#each properties}}
    {{name}}: {{#if (eq type "boolean")}}form.{{name}}.checked{{else if (eq type "number")}}Number(form.{{name}}.value){{else}}form.{{name}}.value{{/if}},
    {{/each}}
  };
  
  if (editId) {
    StateManager.update('{{entity.id}}', editId, data);
  } else {
    StateManager.add('{{entity.id}}', data);
  }
  
  form.reset();
  document.getElementById('{{entity.id}}-edit-id').value = '';
  
  // Go back to list view
  const listView = document.querySelector('[data-view$="-list"]');
  if (listView) listView.click();
  
  render{{capitalize entity.id}}List();
}

function showAddForm(entityId) {
  document.getElementById(entityId + '-edit-id').value = '';
  document.getElementById(entityId + '-form').reset();
  showView(entityId + '-form-view');
}

function showEditForm(entityId, item) {
  document.getElementById(entityId + '-edit-id').value = item.id;
  
  // Populate form fields
  Object.keys(item).forEach(key => {
    const input = document.getElementById(entityId + '-' + key);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = item[key];
      } else {
        input.value = item[key] || '';
      }
    }
  });
  
  showView(entityId + '-form-view');
}

function cancelForm(entityId) {
  const listView = document.querySelector('[data-view$="-list"]');
  if (listView) listView.click();
}
`,
    },
    dependencies: ['style-base', 'state-manager'],
};

export default viewForm;
