import { Pattern } from '../../../types';

export const actionDelete: Pattern = {
    id: 'action-delete',
    name: 'Delete Action',
    description: 'Delete with confirmation dialog',
    category: 'action',
    inputs: [
        { name: 'actionId', type: 'string', required: true },
        { name: 'actionName', type: 'string', required: true },
    ],
    template: {
        html: '',
        css: `
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog.hidden {
  display: none;
}

.confirm-content {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.confirm-message {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
`,
        js: `
// Delete confirmation dialog
function showDeleteConfirm(entityName, itemId, onConfirm) {
  const existing = document.querySelector('.confirm-dialog');
  if (existing) existing.remove();
  
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  dialog.innerHTML = \`
    <div class="confirm-content">
      <h3 class="confirm-title">Confirm Deletion</h3>
      <p class="confirm-message">Are you sure you want to delete this \${entityName}? This action cannot be undone.</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" onclick="closeDeleteConfirm()">Cancel</button>
        <button class="btn btn-danger" onclick="confirmDelete()">Delete</button>
      </div>
    </div>
  \`;
  
  dialog.dataset.itemId = itemId;
  dialog.dataset.callback = onConfirm.toString();
  document.body.appendChild(dialog);
}

function closeDeleteConfirm() {
  const dialog = document.querySelector('.confirm-dialog');
  if (dialog) dialog.remove();
}

function confirmDelete() {
  const dialog = document.querySelector('.confirm-dialog');
  if (dialog) {
    const itemId = dialog.dataset.itemId;
    // Execute callback
    closeDeleteConfirm();
  }
}
`,
    },
    dependencies: ['style-base'],
};

export default actionDelete;
