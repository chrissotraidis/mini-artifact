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
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #app {
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }
    .error-display {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 8px;
      padding: 16px;
      color: #991b1b;
      font-size: 14px;
      z-index: 9999;
    }
    .error-display h4 {
      margin: 0 0 8px 0;
    }
{{{styles}}}
  </style>
</head>
<body>
  <div id="app">
{{{content}}}
  </div>
  <div id="error-container"></div>
  <script>
    // Global error handler to prevent white screen
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('App Error:', message, source, lineno, colno, error);
      var container = document.getElementById('error-container');
      if (container) {
        container.innerHTML = '<div class="error-display"><h4>⚠️ Error</h4><p>' + message + '</p></div>';
      }
      return true; // Prevent default browser error handling
    };
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled Promise rejection:', event.reason);
      var container = document.getElementById('error-container');
      if (container) {
        container.innerHTML = '<div class="error-display"><h4>⚠️ Error</h4><p>' + (event.reason?.message || event.reason) + '</p></div>';
      }
    });

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

