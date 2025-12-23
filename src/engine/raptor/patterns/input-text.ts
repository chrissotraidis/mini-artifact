import { Pattern } from '../../../types';

export const inputText: Pattern = {
    id: 'input-text',
    name: 'Text Input',
    description: 'Text input field',
    category: 'utility',
    inputs: [
        { name: 'fieldName', type: 'string', required: true },
        { name: 'required', type: 'boolean', required: false },
    ],
    template: {
        html: `
<div class="form-group">
  <label class="form-label" for="input-{{fieldName}}">{{capitalize fieldName}}{{#if required}} *{{/if}}</label>
  <input type="text" id="input-{{fieldName}}" name="{{fieldName}}" class="form-input" {{#if required}}required{{/if}}>
</div>`,
        css: '',
        js: '',
    },
    dependencies: ['style-base'],
};

export default inputText;
