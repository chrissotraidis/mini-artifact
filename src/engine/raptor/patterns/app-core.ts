import { Pattern } from '../../../types';

/**
 * App Core Pattern
 * 
 * Generates a unified application controller with all CRUD operations.
 * This is the single source of truth for entity operations, views, and routing.
 */
export const appCore: Pattern = {
    id: 'app-core',
    name: 'App Core',
    description: 'Unified application controller with CRUD operations',
    category: 'utility',
    inputs: [
        { name: 'appName', type: 'string', required: true },
        { name: 'entities', type: 'object[]', required: true },
        { name: 'views', type: 'object[]', required: true },
    ],
    template: {
        html: '',
        css: '',
        js: `
// ============================================================
// {{appName}} - Application Core
// ============================================================

var App = (function() {
    // Storage key
    var STORAGE_KEY = '{{appName}}-data';
    
    // In-memory fallback
    var memoryStorage = {};
    var useMemory = false;
    
    // Test localStorage
    try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
    } catch (e) {
        console.warn('localStorage not available, using in-memory storage');
        useMemory = true;
    }
    
    // Storage adapter
    function getStorage() {
        if (useMemory) {
            return memoryStorage[STORAGE_KEY] ? JSON.parse(memoryStorage[STORAGE_KEY]) : null;
        }
        var data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }
    
    function setStorage(data) {
        var json = JSON.stringify(data);
        if (useMemory) {
            memoryStorage[STORAGE_KEY] = json;
        } else {
            localStorage.setItem(STORAGE_KEY, json);
        }
    }
    
    // Initialize data structure
    function initData() {
        var data = getStorage();
        if (!data) {
            data = {};
            {{#each entities}}
            data['{{id}}'] = [];
            {{/each}}
            setStorage(data);
        }
        return data;
    }
    
    // ============================================================
    // CRUD Operations
    // ============================================================
    
    function getAll(entityId) {
        var data = getStorage() || initData();
        return data[entityId] || [];
    }
    
    function getById(entityId, id) {
        var items = getAll(entityId);
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) return items[i];
        }
        return null;
    }
    
    function add(entityId, item) {
        var data = getStorage() || initData();
        if (!data[entityId]) data[entityId] = [];
        
        var newItem = {};
        for (var key in item) {
            newItem[key] = item[key];
        }
        newItem.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        newItem.createdAt = new Date().toISOString();
        
        data[entityId].push(newItem);
        setStorage(data);
        return newItem;
    }
    
    function update(entityId, id, updates) {
        var data = getStorage() || initData();
        var items = data[entityId] || [];
        
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                for (var key in updates) {
                    items[i][key] = updates[key];
                }
                items[i].updatedAt = new Date().toISOString();
                setStorage(data);
                return items[i];
            }
        }
        return null;
    }
    
    function remove(entityId, id) {
        var data = getStorage() || initData();
        var items = data[entityId] || [];
        
        data[entityId] = items.filter(function(item) {
            return item.id !== id;
        });
        setStorage(data);
    }
    
    // ============================================================
    // View Rendering
    // ============================================================
    
    function showView(viewId) {
        // Hide all views
        var views = document.querySelectorAll('.view');
        for (var i = 0; i < views.length; i++) {
            views[i].style.display = 'none';
        }
        
        // Show target view
        var target = document.getElementById(viewId);
        if (target) {
            target.style.display = 'block';
        }
        
        // Update nav
        var links = document.querySelectorAll('.navbar-link');
        for (var j = 0; j < links.length; j++) {
            links[j].classList.remove('active');
            if (links[j].getAttribute('data-view') === viewId) {
                links[j].classList.add('active');
            }
        }
        
        // Render list if it's a list view
        if (viewId.indexOf('-list') > -1 || target && target.querySelector('.item-list')) {
            {{#each entities}}
            if (viewId.indexOf('{{id}}') > -1) {
                renderList('{{id}}');
            }
            {{/each}}
        }
    }
    
    function renderList(entityId) {
        var listEl = document.getElementById(entityId + '-list');
        var emptyEl = document.getElementById(entityId + '-empty');
        var items = getAll(entityId);
        
        if (!listEl) return;
        
        if (items.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        
        if (emptyEl) emptyEl.style.display = 'none';
        
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            html += '<div class="item-row" data-id="' + item.id + '">';
            html += '<div class="item-content">';
            
            // Show first text property as title
            var title = item.name || item.title || item.label || 'Item ' + (i + 1);
            html += '<strong>' + escapeHtml(String(title)) + '</strong>';
            
            // Show other properties
            for (var key in item) {
                if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'name' && key !== 'title') {
                    var val = item[key];
                    if (typeof val === 'boolean') {
                        val = val ? '✓' : '✗';
                    }
                    html += '<span class="item-prop">' + key + ': ' + escapeHtml(String(val || '-')) + '</span>';
                }
            }
            
            html += '</div>';
            html += '<div class="item-actions">';
            html += '<button class="btn btn-sm btn-secondary" onclick="App.editItem(\\'' + entityId + '\\', \\'' + item.id + '\\')">Edit</button>';
            html += '<button class="btn btn-sm btn-danger" onclick="App.deleteItem(\\'' + entityId + '\\', \\'' + item.id + '\\')">Delete</button>';
            html += '</div>';
            html += '</div>';
        }
        
        listEl.innerHTML = html;
    }
    
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // ============================================================
    // Form Operations
    // ============================================================
    
    function showAddForm(entityId) {
        var formView = document.getElementById(entityId + '-form-view');
        if (formView) {
            // Clear form
            var form = formView.querySelector('form');
            if (form) form.reset();
            var editId = document.getElementById(entityId + '-edit-id');
            if (editId) editId.value = '';
            
            showView(entityId + '-form-view');
        }
    }
    
    function editItem(entityId, id) {
        var item = getById(entityId, id);
        if (!item) return;
        
        var formView = document.getElementById(entityId + '-form-view');
        if (formView) {
            var editId = document.getElementById(entityId + '-edit-id');
            if (editId) editId.value = id;
            
            // Populate form
            for (var key in item) {
                var input = document.getElementById(entityId + '-' + key);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = Boolean(item[key]);
                    } else {
                        input.value = item[key] || '';
                    }
                }
            }
            
            showView(entityId + '-form-view');
        }
    }
    
    function submitForm(entityId, form) {
        var editId = document.getElementById(entityId + '-edit-id');
        var isEdit = editId && editId.value;
        
        var data = {};
        var inputs = form.querySelectorAll('input, select, textarea');
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var name = input.name;
            if (name && name !== 'edit-id') {
                if (input.type === 'checkbox') {
                    data[name] = input.checked;
                } else if (input.type === 'number') {
                    data[name] = Number(input.value) || 0;
                } else {
                    data[name] = input.value;
                }
            }
        }
        
        if (isEdit) {
            update(entityId, editId.value, data);
        } else {
            add(entityId, data);
        }
        
        // Go back to list
        showView(entityId + '-list-view');
    }
    
    function deleteItem(entityId, id) {
        if (confirm('Are you sure you want to delete this item?')) {
            remove(entityId, id);
            renderList(entityId);
        }
    }
    
    // ============================================================
    // Initialization
    // ============================================================
    
    function init() {
        console.log('{{appName}} initialized');
        initData();
        
        // Setup navigation
        var links = document.querySelectorAll('.navbar-link');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function(e) {
                e.preventDefault();
                var viewId = this.getAttribute('data-view');
                if (viewId) showView(viewId);
            });
        }
        
        // Setup forms
        var forms = document.querySelectorAll('form[data-entity]');
        for (var j = 0; j < forms.length; j++) {
            forms[j].addEventListener('submit', function(e) {
                e.preventDefault();
                var entityId = this.getAttribute('data-entity');
                submitForm(entityId, this);
            });
        }
        
        // Setup add buttons
        var addBtns = document.querySelectorAll('[data-add-entity]');
        for (var k = 0; k < addBtns.length; k++) {
            addBtns[k].addEventListener('click', function() {
                var entityId = this.getAttribute('data-add-entity');
                showAddForm(entityId);
            });
        }
        
        // Show first view
        {{#each views}}
        {{#if @first}}
        showView('{{id}}');
        {{/if}}
        {{/each}}
    }
    
    // Public API
    return {
        getAll: getAll,
        getById: getById,
        add: add,
        update: update,
        remove: remove,
        showView: showView,
        renderList: renderList,
        showAddForm: showAddForm,
        editItem: editItem,
        submitForm: submitForm,
        deleteItem: deleteItem,
        init: init
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}
`,
    },
    dependencies: [],
};

export default appCore;
