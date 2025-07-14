// script.js - Consolidated Logic for My Hub (with Export/Import, Custom Modals, and Anime Checkbox)

document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Logic ---
    const toggleBtn = document.getElementById('theme-toggle');

    if (toggleBtn) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const storedTheme = localStorage.getItem('theme');

        if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
            document.body.classList.add('dark');
        } else if (storedTheme === 'light') {
            document.body.classList.remove('dark');
        }

        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // --- Hamburger Menu Logic ---
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("show");
        });
    }

    // --- Highlight Active Navigation Link ---
    const currentPage = window.location.pathname.split('/').pop();
    const navLinksList = document.querySelectorAll('.nav-links a');

    navLinksList.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) {
            link.classList.add('active-nav-link');
        }
    });
    // --- END Highlight Active Navigation Link ---

    // --- Go to Top Button Logic ---
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");

    if (scrollToTopBtn) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add("show");
            } else {
                scrollToTopBtn.classList.remove("show");
            }
        });

        scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }
    // --- END Go to Top Button Logic ---

    // --- Custom Confirmation Modal Logic ---
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalOK = document.getElementById('confirmModalOK');
    const confirmModalCancel = document.getElementById('confirmModalCancel');

    /**
     * Shows a custom confirmation modal.
     * @param {string} title - The title of the modal.
     * @param {string} message - The message to display.
     * @param {function} onConfirm - Callback function to execute if user confirms.
     * @param {string} [okText='Confirm'] - Text for the OK button.
     * @param {string} [cancelText='Cancel'] - Text for the Cancel button.
     */
    function showConfirmModal(title, message, onConfirm, okText = 'Confirm', cancelText = 'Cancel') {
        if (!customConfirmModal) {
            // Fallback to native confirm if modal elements are not found
            if (confirm(message)) {
                onConfirm();
            }
            return;
        }

        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        confirmModalOK.textContent = okText;
        confirmModalCancel.textContent = cancelText;

        // Clear previous event listeners
        confirmModalOK.onclick = null;
        confirmModalCancel.onclick = null;

        // Add new event listeners
        confirmModalOK.onclick = () => {
            customConfirmModal.classList.remove('active');
            onConfirm();
        };

        confirmModalCancel.onclick = () => {
            customConfirmModal.classList.remove('active');
            // Do nothing or call a specific cancel callback if needed
        };

        // Show the modal
        customConfirmModal.classList.add('active');
    }
    window.showConfirmModal = showConfirmModal; // Make it globally accessible for inline onclicks

    // --- END Custom Confirmation Modal Logic ---

    // --- Common List Management Logic ---
    const maxVisible = 5;
    const expanded = {};
    let draggedItem = null;

    function getCurrentTimestamp() {
        const now = new Date();
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
        return new Intl.DateTimeFormat('en-US', options).format(now);
    }

    function getList(type) {
        const stored = localStorage.getItem(`${type}List`);
        return stored ? JSON.parse(stored) : [];
    }

    function saveList(type, list) {
        localStorage.setItem(`${type}List`, JSON.stringify(list));
        localStorage.setItem(`${type}LastUpdated`, getCurrentTimestamp()); // Save timestamp
    }

    function getListLastUpdated(type) {
        return localStorage.getItem(`${type}LastUpdated`) || 'Never';
    }

    function setLastUpdatedDisplay(type) {
        const lastUpdatedDiv = document.querySelector(`#${type}-list`).closest('.card').querySelector('.card-footer .last-updated');
        if (lastUpdatedDiv) {
            lastUpdatedDiv.textContent = `Last updated: ${getListLastUpdated(type)}`;
        }
    }

    // NEW: Function to toggle item completion status (for Anime page only)
    function toggleCompletionStatus(itemName, fromListType) {
        let currentList = getList(fromListType);
        // Find the item object by name
        const itemIndex = currentList.findIndex(item => item.name === itemName);

        if (itemIndex > -1) {
            const itemToMove = currentList[itemIndex];
            currentList.splice(itemIndex, 1); // Remove from current list
            saveList(fromListType, currentList);

            const toListType = (fromListType === 'watching') ? 'completed' : 'watching';
            let targetList = getList(toListType);
            
            // Update completion status for the item being moved
            itemToMove.completed = (toListType === 'completed');
            targetList.push(itemToMove); // Add the updated item to the other list
            saveList(toListType, targetList);

            renderGenericList('watching'); // Re-render both lists
            renderGenericList('completed');
        }
    }

    function createGenericItemElement(type, itemData) {
        const li = document.createElement('li');
        li.setAttribute('draggable', 'true');
        
        // Handle both string items and object items (for anime)
        const name = typeof itemData === 'string' ? itemData : itemData.name;
        const completed = typeof itemData === 'object' ? itemData.completed : false;

        li.dataset.itemName = name;

        // NEW: Add checkbox for 'watching' and 'completed' lists
        if (type === 'watching' || type === 'completed') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'item-checkbox';
            checkbox.checked = completed; // Check based on the 'completed' property

            checkbox.addEventListener('change', () => {
                toggleCompletionStatus(name, type);
            });
            li.appendChild(checkbox);
        }

        const itemTextSpan = document.createElement('span');
        itemTextSpan.className = 'item-text';
        itemTextSpan.textContent = name;
        if (completed) { // Add class for styling if completed
            itemTextSpan.classList.add('completed-item-text');
        }
        li.appendChild(itemTextSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-actions';

        const editBtn = document.createElement('span');
        editBtn.textContent = 'Edit';
        editBtn.className = 'action-btn';
        editBtn.onclick = (event) => {
            event.stopPropagation();
            editGenericItem(li, itemData, type); // Pass itemData to retain 'completed' status
        };
        actionsDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'action-btn';
        deleteBtn.onclick = (event) => {
            event.stopPropagation();
            // Using custom modal
            showConfirmModal(
                `Delete ${type.slice(0, -4) === 'watching' ? 'Anime' : type.slice(0, -4) === 'completed' ? 'Anime' : type.slice(0, -4) || 'Item'}`, // Adjust title for type
                `Are you sure you want to delete "${name}"?`,
                () => { // onConfirm callback
                    let list = getList(type);
                    // Filter based on whether item is string or object
                    list = list.filter(item => (typeof item === 'string' ? item !== name : item.name !== name));
                    saveList(type, list);
                    renderGenericList(type);
                    // Re-render other anime list if current list is watching/completed
                    if (type === 'watching' || type === 'completed') {
                        renderGenericList(type === 'watching' ? 'completed' : 'watching');
                    }
                },
                'Delete',
                'Cancel'
            );
        };
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(actionsDiv);

        li.addEventListener('dragstart', (e) => {
            // Drag the itemData (string or object)
            draggedItem = { element: li, data: itemData, type: type };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', typeof itemData === 'object' ? JSON.stringify(itemData) : itemData);
            li.classList.add('dragging');
        });

        li.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem.type === type && draggedItem.element !== li) {
                li.classList.add('drag-over');
            }
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        li.addEventListener('dragleave', () => {
            li.classList.remove('drag-over');
        });

        li.addEventListener('drop', (e) => {
            e.preventDefault();
            li.classList.remove('drag-over');

            if (draggedItem && draggedItem.type === type && draggedItem.element !== li) {
                const currentList = getList(type);
                const draggedData = draggedItem.data; // Can be string or object
                const dropTargetName = li.dataset.itemName; // Always a string

                let draggedIndex = -1;
                let dropTargetIndex = -1;

                // Find indices based on whether items are strings or objects
                if (typeof draggedData === 'string') {
                    draggedIndex = currentList.indexOf(draggedData);
                    dropTargetIndex = currentList.indexOf(dropTargetName);
                } else { // Item is an object (like anime)
                    draggedIndex = currentList.findIndex(item => item.name === draggedData.name);
                    dropTargetIndex = currentList.findIndex(item => item.name === dropTargetName);
                }

                if (draggedIndex > -1 && dropTargetIndex > -1) {
                    const [removed] = currentList.splice(draggedIndex, 1);
                    currentList.splice(dropTargetIndex, 0, removed);
                    saveList(type, currentList);
                    renderGenericList(type);
                }
            }
        });

        li.addEventListener('dragend', () => {
            draggedItem = null;
            const draggingElements = document.querySelectorAll('.dragging');
            draggingElements.forEach(el => el.classList.remove('dragging'));
            const dragOverElements = document.querySelectorAll('.drag-over');
            dragOverElements.forEach(el => el.classList.remove('drag-over'));
        });

        return li;
    }

    function renderGenericList(type) {
        const list = getList(type);
        const ul = document.getElementById(`${type}-list`);
        if (!ul) return;

        ul.innerHTML = '';

        const h3Element = ul.parentElement.querySelector('h3');
        if (h3Element) {
            const originalTitle = h3Element.getAttribute('data-original-title') || h3Element.textContent.split(' (')[0];
            if (!h3Element.hasAttribute('data-original-title')) {
                h3Element.setAttribute('data-original-title', originalTitle);
            }
            h3Element.textContent = `${originalTitle} (${list.length})`;
        }

        if (list.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            const messageText = type === 'projects' || type === 'upcoming' ? 'No projects here yet! Add your first project above.' :
                                 type === 'watching' || type === 'completed' ? 'No anime here yet! Add your first anime above.' :
                                 type === 'accounts' ? 'No accounts saved yet! Add your first account above.' :
                                 'No notes here yet! Add your first note above.';
            emptyMessage.textContent = messageText;
            ul.appendChild(emptyMessage);
        } else {
            if (typeof expanded[`${type}`] === 'undefined') {
                expanded[`${type}`] = false;
            }

            const visibleList = expanded[`${type}`] ? list : list.slice(0, maxVisible);
            visibleList.forEach(item => {
                const li = createGenericItemElement(type, item);
                ul.appendChild(li);
            });
        }

        const viewBtn = ul.nextElementSibling;
        if (viewBtn && viewBtn.classList.contains('view-more')) {
            viewBtn.style.display = list.length > maxVisible ? 'inline-block' : 'none';
            viewBtn.textContent = expanded[`${type}`] ? 'View Less' : 'View More';
        }

        setLastUpdatedDisplay(type); // Display timestamp after rendering
    }

    window.addItem = function(type) {
        const input = document.getElementById(`${type}-input`);
        if (!input) return;

        const value = input.value.trim();
        if (!value) {
            input.classList.add('input-error');
            setTimeout(() => {
                input.classList.remove('input-error');
            }, 1500);
            return;
        }

        let list = getList(type);
        let itemToAdd;
        let isDuplicate = false;

        if (type === 'watching' || type === 'completed') {
            // For anime, check for duplicate names across both lists
            const allAnime = getList('watching').concat(getList('completed'));
            isDuplicate = allAnime.some(item => (typeof item === 'string' ? item === value : item.name === value));
            itemToAdd = { name: value, completed: (type === 'completed') }; // Store anime as objects
        } else {
            isDuplicate = list.includes(value);
            itemToAdd = value; // Other lists store strings
        }

        if (isDuplicate) {
            showConfirmModal('Duplicate Entry', 'This item already exists in the list!', () => {}, 'OK', 'Dismiss');
            input.classList.add('input-error');
            setTimeout(() => {
                input.classList.remove('input-error');
            }, 1500);
            return;
        }

        list.push(itemToAdd);
        saveList(type, list);
        input.value = '';
        renderGenericList(type);
        // If adding to watching/completed, re-render both to update counts/status
        if (type === 'watching' || type === 'completed') {
            renderGenericList(type === 'watching' ? 'completed' : 'watching');
        }
        input.focus();
    };


    // Updated clearList to use custom modal
    window.clearList = function(type) {
        showConfirmModal(
            `Clear All ${type.charAt(0).toUpperCase() + type.slice(1)}`, // Capitalize first letter for title
            `Are you sure you want to clear all items from the ${type} list? This action cannot be undone.`,
            () => { // onConfirm callback
                saveList(type, []);
                renderGenericList(type);
                // Re-render other anime list if current list is watching/completed
                if (type === 'watching' || type === 'completed') {
                    renderGenericList(type === 'watching' ? 'completed' : 'watching');
                }
            },
            'Yes, Clear All',
            'No, Keep It'
        );
    };

    function editGenericItem(li, oldItemData, type) {
        // Extract oldName and old 'completed' status if it's an object
        const oldName = typeof oldItemData === 'string' ? oldItemData : oldItemData.name;
        const oldCompletedStatus = typeof oldItemData === 'object' ? oldItemData.completed : undefined;


        li.innerHTML = '';
        li.classList.add('editing-item');
        li.removeAttribute('draggable');

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = oldName;
        nameInput.className = 'edit-input';
        nameInput.focus();

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
            const newName = nameInput.value.trim();
            if (!newName) {
                nameInput.classList.add('input-error');
                setTimeout(() => {
                    nameInput.classList.remove('input-error');
                }, 1500);
                return;
            }

            let list = getList(type);
            // Check for duplicates during edit
            let isDuplicate = false;
            if (type === 'watching' || type === 'completed') {
                 // For anime, check for duplicate names across *all* anime lists, excluding the original name
                const allAnime = getList('watching').concat(getList('completed'));
                isDuplicate = allAnime.some(item => {
                    const itemName = typeof item === 'string' ? item : item.name;
                    return itemName === newName && itemName !== oldName;
                });
            } else {
                isDuplicate = list.some(item => item === newName && item !== oldName);
            }


            if (isDuplicate) {
                showConfirmModal('Duplicate Entry', 'An item with this name already exists!', () => {}, 'OK', 'Dismiss');
                nameInput.classList.add('input-error');
                setTimeout(() => { nameInput.classList.remove('input-error'); }, 1500);
                return;
            }

            list = list.map(item => {
                const currentItemName = typeof item === 'string' ? item : item.name;
                if (currentItemName === oldName) {
                    // Preserve existing structure (string or object)
                    return typeof item === 'string' ? newName : { name: newName, completed: oldCompletedStatus };
                }
                return item;
            });
            saveList(type, list);
            li.classList.remove('editing-item');
            renderGenericList(type);
            // Re-render related anime list if editing from watching/completed
            if (type === 'watching' || type === 'completed') {
                renderGenericList(type === 'watching' ? 'completed' : 'watching');
            }
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            li.classList.remove('editing-item');
            renderGenericList(type);
        };

        li.appendChild(nameInput);
        const editActionsDiv = document.createElement('div');
        editActionsDiv.className = 'item-actions';
        editActionsDiv.appendChild(saveBtn);
        editActionsDiv.appendChild(cancelBtn);
        li.appendChild(editActionsDiv);
    }

    window.toggleView = function(type) {
        expanded[`${type}`] = !expanded[`${type}`];
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'bookmarks.html') {
            let listId, storageKey;
            if (type === 'tools') {
                listId = 'tools-list';
                storageKey = 'bookmarks_tools';
            } else if (type === 'entertainment') {
                listId = 'entertainment-list';
                storageKey = 'bookmarks_entertainment';
            }
            renderBookmarkList(listId, storageKey, type);
        } else {
            renderGenericList(type);
        }
    };


    // --- Bookmarks Specific Logic (needs to handle name & URL) ---
    function getBookmarkList(storageKey) {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    function saveBookmarkList(storageKey, list) {
        localStorage.setItem(storageKey, JSON.stringify(list));
        localStorage.setItem(`${storageKey}_lastUpdated`, getCurrentTimestamp()); // Save timestamp for bookmarks
    }

    function getBookmarkListLastUpdated(storageKey) {
        return localStorage.getItem(`${storageKey}_lastUpdated`) || 'Never';
    }

    function setBookmarkLastUpdatedDisplay(listId, storageKey) {
        const lastUpdatedDiv = document.querySelector(`#${listId}`).closest('.card').querySelector('.card-footer .last-updated');
        if (lastUpdatedDiv) {
            lastUpdatedDiv.textContent = `Last updated: ${getBookmarkListLastUpdated(storageKey)}`;
        }
    }

    function createBookmarkElement(name, url, listId, storageKey, type) {
        const li = document.createElement('li');
        li.setAttribute('draggable', 'true');
        li.dataset.itemName = name;
        li.dataset.itemUrl = url;

        const itemTextSpan = document.createElement('span');
        itemTextSpan.className = 'item-text';
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.textContent = name;
        itemTextSpan.appendChild(a);
        li.appendChild(itemTextSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-actions';

        const editBtn = document.createElement('span');
        editBtn.textContent = 'Edit';
        editBtn.className = 'action-btn';
        editBtn.onclick = (event) => {
            event.stopPropagation();
            editBookmark(li, name, url, listId, storageKey, type);
        };
        actionsDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'action-btn';
        deleteBtn.onclick = (event) => {
            event.stopPropagation();
            // Using custom modal
            showConfirmModal(
                `Delete Bookmark`,
                `Are you sure you want to delete "${name}"?`,
                () => { // onConfirm callback
                    let items = getBookmarkList(storageKey);
                    items = items.filter(item => !(item.name === name && item.url === url));
                    saveBookmarkList(storageKey, items);
                    renderBookmarkList(listId, storageKey, type);
                },
                'Delete',
                'Cancel'
            );
        };
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(actionsDiv);

        li.addEventListener('dragstart', (e) => {
            draggedItem = { element: li, data: { name: name, url: url }, type: type, isBookmark: true };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({ name: name, url: url }));
            li.classList.add('dragging');
        });

        li.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem.type === type && draggedItem.element !== li) {
                li.classList.add('drag-over');
            }
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        li.addEventListener('dragleave', () => {
            li.classList.remove('drag-over');
        });

        li.addEventListener('drop', (e) => {
            e.preventDefault();
            li.classList.remove('drag-over');

            if (draggedItem && draggedItem.type === type && draggedItem.element !== li && draggedItem.isBookmark) {
                let currentList = getBookmarkList(storageKey);
                const draggedBookmark = draggedItem.data;
                const dropTargetName = li.dataset.itemName;
                const dropTargetUrl = li.dataset.itemUrl;

                const draggedIndex = currentList.findIndex(item => item.name === draggedBookmark.name && item.url === draggedBookmark.url);
                const dropTargetIndex = currentList.findIndex(item => item.name === dropTargetName && item.url === dropTargetUrl);

                if (draggedIndex > -1 && dropTargetIndex > -1) {
                    const [removed] = currentList.splice(draggedIndex, 1);
                    currentList.splice(dropTargetIndex, 0, removed);
                    saveBookmarkList(storageKey, currentList);
                    renderBookmarkList(listId, storageKey, type);
                }
            }
        });

        li.addEventListener('dragend', () => {
            draggedItem = null;
            const draggingElements = document.querySelectorAll('.dragging');
            draggingElements.forEach(el => el.classList.remove('dragging'));
            const dragOverElements = document.querySelectorAll('.drag-over');
            dragOverElements.forEach(el => el.classList.remove('drag-over'));
        });

        return li;
    }

    function renderBookmarkList(listId, storageKey, type) {
        const ul = document.getElementById(listId);
        if (!ul) return;

        const items = getBookmarkList(storageKey);
        ul.innerHTML = '';

        const h3Element = ul.parentElement.querySelector('h3');
        if (h3Element) {
            const originalTitle = h3Element.getAttribute('data-original-title') || h3Element.textContent.split(' (')[0];
            if (!h3Element.hasAttribute('data-original-title')) {
                h3Element.setAttribute('data-original-title', originalTitle);
            }
            h3Element.textContent = `${originalTitle} (${items.length})`;
        }

        if (items.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            const messageText = `No ${type} bookmarks here yet! Add your first bookmark above.`;
            emptyMessage.textContent = messageText;
            ul.appendChild(emptyMessage);
        } else {
            if (typeof expanded[`${type}`] === 'undefined') {
                expanded[`${type}`] = false;
            }

            const visibleItems = expanded[`${type}`] ? items : items.slice(0, maxVisible);
            visibleItems.forEach(({ name, url }) => {
                const li = createBookmarkElement(name, url, listId, storageKey, type);
                ul.appendChild(li);
            });
        }

        const viewBtn = ul.nextElementSibling;
        if (viewBtn && viewBtn.classList.contains('view-more')) {
            viewBtn.style.display = items.length > maxVisible ? 'inline-block' : 'none';
            viewBtn.textContent = expanded[`${type}`] ? 'View Less' : 'View More';
        }

        setBookmarkLastUpdatedDisplay(listId, storageKey); // Display timestamp for bookmarks
    }

    window.addBookmark = function(listId, nameInputId, urlInputId, storageKey, type) {
        const nameInput = document.getElementById(nameInputId);
        const urlInput = document.getElementById(urlInputId);

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !url) {
            if (!name) {
                nameInput.classList.add('input-error');
                setTimeout(() => { nameInput.classList.remove('input-error'); }, 1500);
            }
            if (!url) {
                urlInput.classList.add('input-error');
                setTimeout(() => { urlInput.classList.remove('input-error'); }, 1500);
            }
            return;
        }

        let items = getBookmarkList(storageKey);
        // Prevent adding duplicates
        if (items.some(item => item.name === name && item.url === url)) {
            showConfirmModal('Duplicate Bookmark', 'A bookmark with this name and URL already exists!', () => {}, 'OK', 'Dismiss');
            nameInput.classList.add('input-error');
            urlInput.classList.add('input-error');
            setTimeout(() => {
                nameInput.classList.remove('input-error');
                urlInput.classList.remove('input-error');
            }, 1500);
            return;
        }
        items.push({ name, url });
        saveBookmarkList(storageKey, items);

        nameInput.value = '';
        urlInput.value = '';

        renderBookmarkList(listId, storageKey, type);
        nameInput.focus();
    };

    // Updated deleteBookmark is now handled by createBookmarkElement's delete button logic.

    // Updated clearBookmarkList to use custom modal
    window.clearBookmarkList = function(listId, storageKey, type) {
        showConfirmModal(
            `Clear All ${type.charAt(0).toUpperCase() + type.slice(1)} Bookmarks`,
            `Are you sure you want to clear all ${type} bookmarks? This action cannot be undone.`,
            () => { // onConfirm callback
                saveBookmarkList(storageKey, []);
                renderBookmarkList(listId, storageKey, type);
            },
            'Yes, Clear All',
            'No, Keep It'
        );
    };

    function editBookmark(li, oldName, oldUrl, listId, storageKey, type) {
        li.innerHTML = '';
        li.classList.add('editing-item');
        li.removeAttribute('draggable');

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = oldName;
        nameInput.className = 'edit-input';
        nameInput.focus();

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.value = oldUrl;
        urlInput.className = 'edit-input';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
            const newName = nameInput.value.trim();
            const newUrl = urlInput.value.trim();
            if (!newName || !newUrl) {
                if (!newName) {
                    nameInput.classList.add('input-error');
                    setTimeout(() => { nameInput.classList.remove('input-error'); }, 1500);
                }
                if (!newUrl) {
                    urlInput.classList.add('input-error');
                    setTimeout(() => { urlInput.classList.remove('input-error'); }, 1500);
                }
                return;
            }

            let items = getBookmarkList(storageKey);
            // Check for duplicates during edit
            if ((newName !== oldName || newUrl !== oldUrl) && items.some(item => item.name === newName && item.url === newUrl)) {
                showConfirmModal('Duplicate Bookmark', 'A bookmark with this name and URL already exists!', () => {}, 'OK', 'Dismiss');
                nameInput.classList.add('input-error');
                urlInput.classList.add('input-error');
                setTimeout(() => {
                    nameInput.classList.remove('input-error');
                    urlInput.classList.remove('input-error');
                }, 1500);
                return;
            }

            items = items.map(item => item.name === oldName && item.url === oldUrl ? { name: newName, url: newUrl } : item);
            saveBookmarkList(storageKey, items);
            li.classList.remove('editing-item');
            renderBookmarkList(listId, storageKey, type);
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            li.classList.remove('editing-item');
            renderBookmarkList(listId, storageKey, type);
        };

        li.appendChild(nameInput);
        li.appendChild(urlInput);
        const editActionsDiv = document.createElement('div');
        editActionsDiv.className = 'item-actions';
        editActionsDiv.appendChild(saveBtn);
        editActionsDiv.appendChild(cancelBtn);
        li.appendChild(editActionsDiv);
    }

    // --- NEW: Export/Import Data Functions ---

    // Define all keys to export/import
    const localStorageKeys = [
        'watchingList', 'watchingLastUpdated',
        'completedList', 'completedLastUpdated',
        'projectsList', 'projectsLastUpdated',
        'upcomingList', 'upcomingLastUpdated',
        'accountsList', 'accountsLastUpdated',
        'notesList', 'notesLastUpdated',
        'bookmarks_tools', 'bookmarks_tools_lastUpdated',
        'bookmarks_entertainment', 'bookmarks_entertainment_lastUpdated'
    ];

    window.exportData = function() { // Make globally accessible
        const data = {};
        localStorageKeys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item !== null) { // Only export if item exists
                try {
                    // Try to parse if it's a list (JSON string), otherwise keep as is
                    data[key] = JSON.parse(item);
                } catch (e) {
                    data[key] = item; // Keep as string if not valid JSON
                }
            }
        });

        const jsonData = JSON.stringify(data, null, 2); // Pretty print JSON
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_hub_data_${new Date().toISOString().split('T')[0]}.json`; // e.g., my_hub_data_2025-06-05.json
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up
        alert('Data exported successfully!'); // Keeping alert for export, as it's not a confirmation
    }

    // Updated importData to use custom modal for confirmation
    window.importData = function(event) { // Make globally accessible
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        showConfirmModal(
            'Confirm Data Import',
            'Importing data will overwrite all your existing lists and bookmarks. Are you sure you want to proceed?',
            () => { // onConfirm callback
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        
                        // Clear existing relevant data before importing
                        localStorageKeys.forEach(key => {
                            localStorage.removeItem(key);
                        });

                        // Set new data
                        for (const key in importedData) {
                            if (localStorageKeys.includes(key)) {
                                const value = importedData[key];
                                localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
                            }
                        }
                        alert('Data imported successfully! The page will now refresh.'); // Keeping alert after successful import
                        location.reload(); // Refresh the page to render imported data
                    } catch (error) {
                        alert('Failed to import data. Please ensure it\'s a valid JSON file.');
                        console.error('Import error:', error);
                    } finally {
                        event.target.value = ''; // Clear the selected file input
                    }
                };
                reader.readAsText(file);
            },
            'Yes, Overwrite',
            'No, Cancel'
        );
        event.target.value = ''; // Clear the selected file immediately after showing modal
    }

    // Attach event listeners for Export/Import buttons (only on index.html)
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');

    if (exportDataBtn && importDataBtn && importFileInput) {
        exportDataBtn.addEventListener('click', exportData);
        importDataBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', importData);
    }

    // --- End NEW: Export/Import Data Functions ---


    // --- Page-specific initialization logic ---
    const pageFileName = window.location.pathname.split('/').pop();

    if (pageFileName === 'anime.html') {
        renderGenericList('watching');
        renderGenericList('completed');
    } else if (pageFileName === 'projects.html') {
        renderGenericList('projects');
        renderGenericList('upcoming');
    } else if (pageFileName === 'vault.html') {
        renderGenericList('accounts');
        renderGenericList('notes');
    } else if (pageFileName === 'bookmarks.html') {
        renderBookmarkList('tools-list', 'bookmarks_tools', 'tools');
        renderBookmarkList('entertainment-list', 'bookmarks_entertainment', 'entertainment');
    }
});
