document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    populateParentSelect();
});

function fetchCategories() {
    fetch('/categories')
        .then(response => response.json())
        .then(data => {
            const categoriesDiv = document.getElementById('categories');
            categoriesDiv.innerHTML = '';
            data.forEach(category => {
                if (category.parentId === null) {
                    const h2 = document.createElement('h2');
                    h2.id = category.name.toLowerCase().replace(' ', '-');
                    h2.textContent = category.name;
                    categoriesDiv.appendChild(h2);
                    displaySubcategories(categoriesDiv, data, category.id);
                }
            });
            displayDescriptions(data);
        });
}

function displaySubcategories(parentElement, allCategories, parentId) {
    const ul = document.createElement('ul');
    parentElement.appendChild(ul);
    allCategories.forEach(category => {
        if (category.parentId === parentId) {
            const li = document.createElement('li');
            if (category.description) {
                li.innerHTML = `<a href="#${category.name.toLowerCase().replace(' ', '-')}" class="category">${category.name}</a>`;
            } else {
                li.textContent = category.name;
            }
            ul.appendChild(li);
            displaySubcategories(li, allCategories, category.id);
        }
    });
}

function displayDescriptions(allCategories) {
    const descriptionsDiv = document.getElementById('descriptions');
    descriptionsDiv.innerHTML = '';
    allCategories.forEach(category => {
        if (category.description) {
            const h3 = document.createElement('h3');
            h3.id = category.name.toLowerCase().replace(' ', '-');
            h3.textContent = category.name;
            const p = document.createElement('p');
            p.textContent = category.description;
            descriptionsDiv.appendChild(h3);
            descriptionsDiv.appendChild(p);
        }
    });
}

function populateParentSelect() {
    fetch('/categories')
        .then(response => response.json())
        .then(data => {
            const parentSelect = document.getElementById('parent');
            data.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                parentSelect.appendChild(option);
            });
        });
}

document.getElementById('addCategoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const parentId = document.getElementById('parent').value || null;
    const description = document.getElementById('description').value;
    fetch('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId, description })
    })
    .then(response => response.json())
    .then(data => {
        alert('Category added successfully');
        fetchCategories();
        populateParentSelect();
        document.getElementById('addCategoryForm').reset();
    })
    .catch(error => console.error('Error:', error));
});