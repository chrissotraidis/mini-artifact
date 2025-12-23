import { Pattern } from '../../../types';

export const inputSelect: Pattern = {
    id: 'input-select',
    name: 'Select Input',
    description: 'Dropdown select input field',
    category: 'utility',
    inputs: [
        { name: 'fieldName', type: 'string', required: true },
        { name: 'options', type: 'string[]', required: false },
        { name: 'required', type: 'boolean', required: false },
    ],
    template: {
        html: `
<div class="form-group">
  <label class="form-label" for="input-{{fieldName}}">{{capitalize fieldName}}{{#if required}} *{{/if}}</label>
  <select id="input-{{fieldName}}" name="{{fieldName}}" class="form-input" {{#if required}}required{{/if}}>
    <option value="">Select...</option>
    {{#each options}}
    <option value="{{this}}">{{this}}</option>
    {{/each}}
  </select>
</div>`,
        css: `
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}
`,
        js: '',
    },
    dependencies: ['style-base'],
};

export default inputSelect;
