import { Pattern } from '../../../types';

export const stateManager: Pattern = {
    id: 'state-manager',
    name: 'State Manager',
    description: 'localStorage-based state management system',
    category: 'utility',
    inputs: [
        { name: 'entities', type: 'string[]', required: true },
    ],
    template: {
        html: '',
        css: '',
        js: `
// State Manager - localStorage persistence
const StateManager = {
  storageKey: '{{appName}}-data',

  // Initialize state with default values
  init() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      const initial = {
        {{#each entities}}
        {{this}}: [],
        {{/each}}
      };
      this.save(initial);
    }
    return this.load();
  },

  // Load state from localStorage
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load state:', e);
      return {};
    }
  },

  // Save state to localStorage
  save(state) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  },

  // Get all items for an entity
  getAll(entityName) {
    const state = this.load();
    return state[entityName] || [];
  },

  // Get a single item by ID
  getById(entityName, id) {
    const items = this.getAll(entityName);
    return items.find(item => item.id === id);
  },

  // Add a new item
  add(entityName, item) {
    const state = this.load();
    const items = state[entityName] || [];
    const newItem = {
      ...item,
      id: item.id || Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    state[entityName] = items;
    this.save(state);
    return newItem;
  },

  // Update an existing item
  update(entityName, id, updates) {
    const state = this.load();
    const items = state[entityName] || [];
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      state[entityName] = items;
      this.save(state);
      return items[index];
    }
    return null;
  },

  // Delete an item
  delete(entityName, id) {
    const state = this.load();
    const items = state[entityName] || [];
    state[entityName] = items.filter(item => item.id !== id);
    this.save(state);
  },

  // Clear all data for an entity
  clear(entityName) {
    const state = this.load();
    state[entityName] = [];
    this.save(state);
  },

  // Clear all data
  clearAll() {
    localStorage.removeItem(this.storageKey);
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  StateManager.init();
});
`,
    },
    dependencies: [],
};

export default stateManager;
