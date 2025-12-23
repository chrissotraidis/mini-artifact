import { Pattern } from '../../../types';

export const inputCheckbox: Pattern = {
    id: 'input-checkbox',
    name: 'Checkbox Input',
    description: 'Checkbox input field',
    category: 'utility',
    inputs: [
        { name: 'fieldName', type: 'string', required: true },
    ],
    template: {
        html: `
<div class="form-group form-group-checkbox">
  <label class="form-label-checkbox">
    <input type="checkbox" id="input-{{fieldName}}" name="{{fieldName}}" class="form-checkbox">
    <span>{{capitalize fieldName}}</span>
  </label>
</div>`,
        css: `
.form-group-checkbox {
  display: flex;
  align-items: center;
}

.form-label-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-primary);
}
`,
        js: '',
    },
    dependencies: ['style-base'],
};

export default inputCheckbox;
