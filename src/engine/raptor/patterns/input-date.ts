import { Pattern } from '../../../types';

export const inputDate: Pattern = {
    id: 'input-date',
    name: 'Date Input',
    description: 'Date picker input field',
    category: 'utility',
    inputs: [
        { name: 'fieldName', type: 'string', required: true },
        { name: 'required', type: 'boolean', required: false },
    ],
    template: {
        html: `
<div class="form-group">
  <label class="form-label" for="input-{{fieldName}}">{{capitalize fieldName}}{{#if required}} *{{/if}}</label>
  <input type="date" id="input-{{fieldName}}" name="{{fieldName}}" class="form-input" {{#if required}}required{{/if}}>
</div>`,
        css: `
input[type="date"] {
  color-scheme: dark;
}
`,
        js: '',
    },
    dependencies: ['style-base'],
};

export default inputDate;
