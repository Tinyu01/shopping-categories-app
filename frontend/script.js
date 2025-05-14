document.addEventListener('DOMContentLoaded', () => {
    // Initialize application
    initializeApp();
    
    // Attach event listeners
    document.getElementById('addCategoryForm').addEventListener('submit', handleCategorySubmit);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    
    // Handle smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Account for header height
                    behavior: 'smooth'
                });
            }
            
            // Update active link
            document.querySelectorAll('nav a').forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
});

/**
 * Initialize the application by fetching data and setting up UI
 */
function initializeApp() {
    fetchCategories()
        .then(categories => {
            renderCategoryTree(categories);
            renderDescriptions(categories);
            populateParentSelect(categories);
        })
        .catch(error => {
            showToast('Error loading categories: ' + error.message, 'error');
            console.error('Error:', error);
        });
}

/**
 * Fetch categories from the API
 * @returns {Promise<Array>} Promise resolving to categories array
 */
async function fetchCategories() {
    try {
        const response = await fetch('/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

/**
 * Render the hierarchical category tree
 * @param {Array} categories Array of category objects
 */
function renderCategoryTree(categories) {
    const container = document.getElementById('categories-tree');
    container.innerHTML = '';
    
    if (categories.length === 0) {
        renderEmptyState(container, 'No categories found', 'Create your first category to get started');
        return;
    }
    
    // Get top-level categories (no parent)
    const topLevelCategories = categories.filter(category => category.parentId === null);
    
    if (topLevelCategories.length === 0) {
        renderEmptyState(container, 'No top-level categories found', 'Create a category without a parent to start building your hierarchy');
        return;
    }
    
    // Create the tree structure
    const ul = document.createElement('ul');
    container.appendChild(ul);
    
    topLevelCategories.forEach(category => {
        appendCategoryToList(ul, category, categories);
    });
    
    // Add toggle functionality for expandable items
    addToggleFunctionality();
}

/**
 * Append a category to a list element and recursively append its children
 * @param {HTMLElement} parentElement The parent element to append to
 * @param {Object} category The category object
 * @param {Array} allCategories All categories for finding children
 */
function appendCategoryToList(parentElement, category, allCategories) {
    const children = allCategories.filter(c => c.parentId === category.id);
    const hasChildren = children.length > 0;
    
    const li = document.createElement('li');
    li.className = 'category-item';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'category-name';
    
    if (hasChildren) {
        const toggle = document.createElement('span');
        toggle.className = 'category-toggle';
        toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        toggle.dataset.expanded = 'false';
        nameDiv.appendChild(toggle);
    } else {
        // Add spacing to align items without toggles
        const spacer = document.createElement('span');
        spacer.style.width = '1.25rem';
        spacer.style.marginRight = '0.5rem';
        nameDiv.appendChild(spacer);
    }
    
    // Create icon based on category level
    const icon = document.createElement('i');
    icon.className = hasChildren 
        ? 'fas fa-folder-open' 
        : category.description 
            ? 'fas fa-file-alt'
            : 'fas fa-file';
    icon.style.marginRight = '0.5rem';
    icon.style.color = hasChildren ? '#f59e0b' : '#4f46e5';
    nameDiv.appendChild(icon);
    
    if (category.description) {
        const link = document.createElement('a');
        link.className = 'category-link';
        link.textContent = category.name;
        link.href = `#${category.name.toLowerCase().replace(/\s+/g, '-')}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showCategoryDescription(category);
        });
        nameDiv.appendChild(link);
    } else {
        const span = document.createElement('span');
        span.textContent = category.name;
        nameDiv.appendChild(span);
    }
    
    li.appendChild(nameDiv);
    
    if (hasChildren) {
        const childUl = document.createElement('ul');
        childUl.style.display = 'none';
        children.forEach(child => {
            appendCategoryToList(childUl, child, allCategories);
        });
        li.appendChild(childUl);
    }
    
    parentElement.appendChild(li);
}

/**
 * Add toggle functionality to category tree items
 */
function addToggleFunctionality() {
    document.querySelectorAll('.category-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const isExpanded = this.dataset.expanded === 'true';
            const childList = this.closest('.category-item').querySelector('ul');
            
            if (isExpanded) {
                this.innerHTML = '<i class="fas fa-chevron-right"></i>';
                this.dataset.expanded = 'false';
                childList.style.display = 'none';
            } else {
                this.innerHTML = '<i class="fas fa-chevron-down"></i>';
                this.dataset.expanded = 'true';
                childList.style.display = 'block';
            }
        });
    });
}

/**
 * Show a category description in a panel
 * @param {Object} category The category to display
 */
function showCategoryDescription(category) {
    // Find any existing description panels and remove them
    const existingPanels = document.querySelectorAll('.description-panel');
    existingPanels.forEach(panel => panel.remove());
    
    // Create new description panel
    const panel = document.createElement('div');
    panel.className = 'description-panel';
    panel.innerHTML = `
        <div class="description-header">${category.name}</div>
        <div class="description-content">${category.description}</div>
    `;
    
    // Insert after the clicked category
    const categoryItem = document.querySelector(`a[href="#${category.name.toLowerCase().replace(/\s+/g, '-')}"]`).closest('.category-item');
    categoryItem.appendChild(panel);
    
    // Scroll to the panel
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Render descriptions in card layout
 * @param {Array} categories Array of category objects
 */
function renderDescriptions(categories) {
    const container = document.getElementById('descriptions-container');
    container.innerHTML = '';
    
    // Filter categories with descriptions
    const categoriesWithDescriptions = categories.filter(category => category.description);
    
    if (categoriesWithDescriptions.length === 0) {
        renderEmptyState(container, 'No descriptions found', 'Add descriptions to your categories to see them here');
        return;
    }
    
    categoriesWithDescriptions.forEach(category => {
        const card = document.createElement('div');
        card.className = 'description-card';
        card.id = category.name.toLowerCase().replace(/\s+/g, '-');
        
        // Find the category's path (breadcrumb)
        const path = getCategoryPath(category, categories);
        
        card.innerHTML = `
            <h3><i class="fas fa-tag"></i> ${category.name}</h3>
            <p class="description-content">${category.description}</p>
            <div class="category-path" style="margin-top: 10px; font-size: 0.875rem; color: var(--gray-400);">
                <i class="fas fa-sitemap" style="margin-right: 5px;"></i> ${path}
            </div>
        `;
        
        container.appendChild(card);
    });
}

/**
 * Get the full path (breadcrumb) for a category
 * @param {Object} category The category
 * @param {Array} allCategories All categories
 * @returns {String} The path as a string
 */
function getCategoryPath(category, allCategories) {
    const path = [];
    let current = category;
    
    // Don't include the current category in the path
    
    // Follow parent chain
    while (current.parentId !== null) {
        const parent = allCategories.find(c => c.id === current.parentId);
        if (!parent) break;
        path.unshift(parent.name);
        current = parent;
    }
    
    return path.length > 0 ? path.join(' / ') : 'Top Level';
}

/**
 * Populate the parent select dropdown
 * @param {Array} categories Array of category objects
 */
function populateParentSelect(categories) {
    const parentSelect = document.getElementById('parent');
    
    // Clear existing options except the first one
    while (parentSelect.options.length > 1) {
        parentSelect.remove(1);
    }
    
    // Sort categories by name for easier navigation
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        
        // Get the full path for this category
        const path = getCategoryPath(category, categories);
        const displayName = path !== 'Top Level' ? `${category.name} (${path})` : category.name;
        
        option.textContent = displayName;
        parentSelect.appendChild(option);
    });
}

/**
 * Handle category form submission
 * @param {Event} e Form submit event
 */
async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const parentId = document.getElementById('parent').value || null;
    const description = document.getElementById('description').value;
    
    try {
        const response = await fetch('/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parentId, description })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add category');
        }
        
        const result = await response.json();
        
        showToast('Category added successfully', 'success');
        resetForm();
        initializeApp(); // Refresh the data
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        console.error('Error adding category:', error);
    }
}

/**
 * Reset the form fields
 */
function resetForm() {
    document.getElementById('addCategoryForm').reset();
}

/**
 * Show a toast notification
 * @param {String} message Message to display
 * @param {String} type Type of toast (success or error)
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    container.appendChild(toast);
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (container.contains(toast)) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Render empty state UI
 * @param {HTMLElement} container The container element
 * @param {String} title The empty state title
 * @param {String} description The empty state description
 */
function renderEmptyState(container, title, description) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fas fa-folder-open"></i>
            </div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-description">${description}</p>
        </div>
    `;
}

/**
 * Update a category
 * @param {Number} id Category ID
 * @param {Object} data Updated category data
 * @returns {Promise} Promise resolving to updated category
 */
async function updateCategory(id, data) {
    try {
        const response = await fetch(`/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update category');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
}

/**
 * Delete a category
 * @param {Number} id Category ID
 * @returns {Promise} Promise resolving when category is deleted
 */
async function deleteCategory(id) {
    try {
        const response = await fetch(`/categories/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            if (response.status === 400) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete category');
            }
            throw new Error('Failed to delete category');
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}

/**
 * Search categories by name
 * @param {Array} categories All categories
 * @param {String} searchTerm Term to search for
 * @returns {Array} Filtered categories
 */
function searchCategories(categories, searchTerm) {
    if (!searchTerm.trim()) return categories;
    
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(category => 
        category.name.toLowerCase().includes(term) || 
        (category.description && category.description.toLowerCase().includes(term))
    );
}

// Add search functionality if needed later
// document.getElementById('searchInput').addEventListener('input', function() {
//     const searchTerm = this.value;
//     fetchCategories()
//         .then(categories => {
//             const filteredCategories = searchCategories(categories, searchTerm);
//             renderCategoryTree(filteredCategories);
//             renderDescriptions(filteredCategories);
//         });
// });

// Add keyboard shortcuts for better navigation
document.addEventListener('keydown', function(e) {
    // Esc key to close any open panels
    if (e.key === 'Escape') {
        const existingPanels = document.querySelectorAll('.description-panel');
        existingPanels.forEach(panel => panel.remove());
    }
});