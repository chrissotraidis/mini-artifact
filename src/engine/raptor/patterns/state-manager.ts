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
// Storage adapter with fallback
const Storage = (function() {
  let memoryStorage = {};
  let useMemory = false;
  
  // Test if localStorage works
  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
  } catch (e) {
    console.warn('localStorage not available, using in-memory storage');
    useMemory = true;
  }
  
  return {
    getItem(key) {
      if (useMemory) return memoryStorage[key] || null;
      return localStorage.getItem(key);
    },
    setItem(key, value) {
      if (useMemory) { memoryStorage[key] = value; return; }
      localStorage.setItem(key, value);
    },
    removeItem(key) {
      if (useMemory) { delete memoryStorage[key]; return; }
      localStorage.removeItem(key);
    }
  };
})();

// State Manager - persistent state management
const StateManager = {
  storageKey: '{{appName}}-data',

  // Initialize state with default values
  init() {
    const stored = Storage.getItem(this.storageKey);
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

  // Load state from storage
  load() {
    try {
      const stored = Storage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load state:', e);
      return {};
    }
  },

  // Save state to storage
  save(state) {
    try {
      Storage.setItem(this.storageKey, JSON.stringify(state));
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
    Storage.removeItem(this.storageKey);
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
