import { Pattern } from '../../../types';

/**
 * View Form Pattern (Simplified)
 * 
 * Generates HTML form only - all JS logic handled by app-core pattern.
 * Uses data attributes for app-core to hook into.
 */
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
<div id="{{viewId}}" class="view" style="display: none;">
  <div class="view-header">
    <h2>{{viewName}}</h2>
  </div>
  
  <div class="form-container">
    <form data-entity="{{entity.id}}" class="form">
      <input type="hidden" id="{{entity.id}}-edit-id" name="edit-id">
      
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
        <button type="button" class="btn btn-secondary" onclick="App.showView('{{entity.id}}-list-view')">Cancel</button>
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

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
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
    js: '', // All JS handled by app-core
  },
  dependencies: ['style-base', 'app-core'],
};

export default viewForm;
