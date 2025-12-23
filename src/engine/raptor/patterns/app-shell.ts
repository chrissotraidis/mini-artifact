import { Pattern } from '../../../types';

export const appShell: Pattern = {
    id: 'app-shell',
    name: 'App Shell',
    description: 'Basic HTML structure with head, body, and container',
    category: 'layout',
    inputs: [
        { name: 'appName', type: 'string', required: true },
        { name: 'description', type: 'string', required: false },
    ],
    template: {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{{description}}">
  <title>{{appName}}</title>
  <style>
{{{styles}}}
  </style>
</head>
<body>
  <div id="app">
{{{content}}}
  </div>
  <script>
{{{scripts}}}
  </script>
</body>
</html>`,
        css: '',
        js: '',
    },
    dependencies: ['style-base'],
};

export default appShell;
