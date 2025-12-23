import { Pattern } from '../../../types';

export const actionButton: Pattern = {
    id: 'action-button',
    name: 'Action Button',
    description: 'Clickable button trigger',
    category: 'action',
    inputs: [
        { name: 'actionId', type: 'string', required: true },
        { name: 'actionName', type: 'string', required: true },
        { name: 'logic', type: 'string', required: false },
    ],
    template: {
        html: `<button id="{{actionId}}-btn" class="btn btn-primary" onclick="handle{{capitalize actionId}}()">{{actionName}}</button>`,
        css: '',
        js: `
function handle{{capitalize actionId}}() {
  // {{logic}}
  console.log('Action triggered: {{actionName}}');
}
`,
    },
    dependencies: ['style-base'],
};

export default actionButton;
