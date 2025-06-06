// vault.js - Comprehensive Logic for the Vault Page
// Includes: Common UI, List Management, Password Protection, Forgot Password/Reset

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements for Password Logic ---
    const passwordModal = document.getElementById('password-modal');
    const vaultPasswordInput = document.getElementById('vault-password-input');
    const vaultUnlockBtn = document.getElementById('vault-unlock-btn');
    const passwordError = document.getElementById('password-error');
    const vaultContent = document.getElementById('vault-content');

    // For "Forgot Password" feature
    const forgotPasswordSection = document.getElementById('forgot-password-section');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const setNewPasswordModal = document.getElementById('set-new-password-modal');
    const newPasswordInput = document.getElementById('new-password-input');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password-input');
    const setNewPasswordBtn = document.getElementById('set-password-btn');
    const newPasswordErrorMessage = document.getElementById('new-password-error-message');

    // Password Toggle Icons
    const vaultPasswordToggle = document.getElementById('vault-password-toggle');
    const newPasswordToggle1 = document.getElementById('new-password-toggle-1');
    const newPasswordToggle2 = document.getElementById('new-password-toggle-2');


    // --- Password Configuration ---
    // IMPORTANT: CHANGE THIS PASSWORD to your desired vault password.
    // If VAULT_PASSWORD is an empty string, the 'Set New Password' modal will appear on first visit.
    // It will be stored in localStorage after it's set.
    let VAULT_PASSWORD = localStorage.getItem('VAULT_PASSWORD'); // Load from localStorage first


    const MAX_FAILED_ATTEMPTS = 5; // Number of incorrect attempts before "Forgot Password" appears
    let failedAttempts = parseInt(localStorage.getItem('vaultFailedAttempts') || '0', 10);


    // --- Helper function to show/hide elements ---
    // Uses CSS 'display' property for toggling visibility
    function showElement(element) {
        if (element) element.style.display = 'block';
    }

    function hideElement(element) {
        if (element) element.style.display = 'none';
    }


    // --- Custom Confirmation Modal Logic (Copied from script.js) ---
    // This provides a consistent custom modal for user confirmations (e.g., clear list, delete item)
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalOK = document.getElementById('confirmModalOK');
    const confirmModalCancel = document.getElementById('confirmModalCancel');

    function showConfirmModal(title, message, onConfirm, okText = 'Confirm', cancelText = 'Cancel') {
        if (!customConfirmModal) {
            // Fallback to native confirm if modal elements are not found in HTML
            if (confirm(message)) {
                onConfirm();
            }
            return;
        }

        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        confirmModalOK.textContent = okText;
        confirmModalCancel.textContent = cancelText;

        // Clear previous event listeners to prevent multiple executions
        confirmModalOK.onclick = null;
        confirmModalCancel.onclick = null;

        // Add new event listeners for the current confirmation
        confirmModalOK.onclick = () => {
            customConfirmModal.classList.remove('active'); // Hide modal with transition
            onConfirm(); // Execute the user's confirmation callback
        };

        confirmModalCancel.onclick = () => {
            customConfirmModal.classList.remove('active'); // Hide modal with transition
            // No action needed for cancel, just close the modal
        };

        customConfirmModal.classList.add('active'); // Show modal with transition
    }
    // Make this function accessible globally for inline onclicks in HTML (e.g., clearList)
    window.showConfirmModal = showConfirmModal;


    // --- Password Visibility Toggle Function ---
    function setupPasswordToggle(inputElement, toggleElement) {
        if (inputElement && toggleElement) {
            toggleElement.addEventListener('click', () => {
                const icon = toggleElement.querySelector('i');
                if (inputElement.type === 'password') {
                    inputElement.type = 'text';
                    if (icon) {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    }
                } else {
                    inputElement.type = 'password';
                    if (icon) {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        }
    }

    // Apply password toggle to all relevant inputs
    setupPasswordToggle(vaultPasswordInput, vaultPasswordToggle);
    setupPasswordToggle(newPasswordInput, newPasswordToggle1);
    setupPasswordToggle(confirmNewPasswordInput, newPasswordToggle2);


    // --- Vault Access State Management ---

    // Function to update the visibility of "Forgot Password" link based on failed attempts
    function updateForgotPasswordVisibility() {
        if (forgotPasswordSection) {
            // Show link only if a password is set and failed attempts exceed limit
            if (VAULT_PASSWORD && failedAttempts >= MAX_FAILED_ATTEMPTS) {
                showElement(forgotPasswordSection);
                forgotPasswordSection.style.display = 'block'; // Ensure it's block to break line
            } else {
                hideElement(forgotPasswordSection);
            }
        }
    }

    // Main function to control which vault screen is visible (login, set new password, or content)
    function initializeVaultDisplay() {
        const isVaultUnlockedSession = sessionStorage.getItem('vaultUnlocked') === 'true';

        if (!VAULT_PASSWORD) {
            // Scenario 1: No password set (first time user or after reset)
            showSetNewPasswordModal();
            // Ensure passwordModal is hidden as setNewPasswordModal is showing
            passwordModal.classList.remove('active');
            hideElement(vaultContent);
        } else if (isVaultUnlockedSession) {
            // Scenario 2: Vault is already unlocked in this session
            passwordModal.classList.remove('active'); // Hide password modal if it somehow became active
            hideElement(setNewPasswordModal);
            showElement(vaultContent);
            // Render lists after content becomes visible and elements are queryable
            // Adding a small delay to ensure content is fully visible before rendering
            setTimeout(() => {
                renderGenericList('vault-notes');
                renderGenericList('vault-links');
            }, 50);
        } else {
            // Scenario 3: Password needs to be entered (first visit in session or after logout/tab close)
            showElement(passwordModal);
            passwordModal.classList.add('active'); // Ensure modal has 'active' class for styling/transitions
            hideElement(setNewPasswordModal);
            hideElement(vaultContent);
            passwordError.classList.remove('show'); // Clear any previous error message
            vaultPasswordInput.value = ''; // Clear password input field
            updateForgotPasswordVisibility(); // Check and show/hide forgot password link
            // Focus on password input after a slight delay to allow modal transition
            setTimeout(() => {
                if (vaultPasswordInput) vaultPasswordInput.focus();
            }, 350);
        }
    }

    // --- Unlock Vault Logic ---
    function unlockVault() {
        const enteredPassword = vaultPasswordInput.value;

        if (enteredPassword === VAULT_PASSWORD) {
            passwordModal.classList.remove('active'); // Hide modal with CSS transition
            // Wait for transition to complete before changing display property
            setTimeout(() => {
                hideElement(passwordModal);
                showElement(vaultContent);
                sessionStorage.setItem('vaultUnlocked', 'true'); // Mark as unlocked for current session
                failedAttempts = 0; // Reset failed attempts on successful login
                localStorage.setItem('vaultFailedAttempts', '0'); // Persist reset status
                initializeVaultDisplay(); // Re-initialize display to ensure content is fully loaded
            }, 300); // Duration matches CSS transition for .modal-overlay

            passwordError.classList.remove('show'); // Hide error message
            vaultPasswordInput.value = ''; // Clear password input field
            vaultPasswordInput.classList.remove('input-error'); // Ensure error styling is removed on success
        } else {
            failedAttempts++;
            localStorage.setItem('vaultFailedAttempts', failedAttempts.toString()); // Persist failed attempts
            passwordError.textContent = `Incorrect password. Attempts: ${failedAttempts}/${MAX_FAILED_ATTEMPTS}`;
            passwordError.classList.add('show'); // Show error message
            
            // Visual feedback: Add 'input-error' class to shake and change border color
            vaultPasswordInput.classList.add('input-error'); 
            
            // Clear input and refocus for next attempt
            vaultPasswordInput.value = ''; 
            vaultPasswordInput.focus();

            // Remove 'input-error' class after a short delay (e.g., 1.5 seconds)
            setTimeout(() => {
                vaultPasswordInput.classList.remove('input-error');
            }, 1500); // Matches the duration of the shake animation
            
            updateForgotPasswordVisibility(); // Update forgot password link visibility
        }
    }

    // Event listener for unlock button click
    if (vaultUnlockBtn) {
        vaultUnlockBtn.addEventListener('click', unlockVault);
    }

    // Event listener for Enter key press in password input field
    if (vaultPasswordInput) {
        vaultPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default form submission if any
                unlockVault(); // Trigger unlock logic
            }
        });
    }


    // --- "Forgot Password" Logic ---
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showConfirmModal(
                'Reset Vault and Data',
                'This will permanently delete ALL your vault notes and links and require you to set a new password. This action cannot be undone. Are you sure you want to proceed?',
                () => { // onConfirm callback
                    console.log('User confirmed vault reset. Clearing localStorage...');
                    // Clear all relevant vault data from localStorage.
                    localStorage.removeItem('notesList');
                    localStorage.removeItem('notesListLastUpdated');
                    localStorage.removeItem('accountsList');
                    localStorage.removeItem('accountsListLastUpdated');
                    localStorage.removeItem('VAULT_PASSWORD');
                    localStorage.removeItem('vaultFailedAttempts');
                    sessionStorage.removeItem('vaultUnlocked');

                    VAULT_PASSWORD = '';
                    failedAttempts = 0;
                    localStorage.setItem('vaultFailedAttempts', '0');

                    renderGenericList('vault-notes');
                    renderGenericList('vault-links');

                    passwordModal.classList.remove('active');
                    setTimeout(() => {
                        hideElement(passwordModal);
                        showSetNewPasswordModal();
                    }, 300);
                },
                'Yes, Delete & Reset',
                'No, Go Back'
            );
        });
    }


    // --- Set New Password Modal Logic ---
    function showSetNewPasswordModal() {
        if (setNewPasswordModal) setNewPasswordModal.style.display = 'flex';
        if (setNewPasswordModal) setNewPasswordModal.classList.add('active');
        if (vaultContent) hideElement(vaultContent);
        if (passwordModal) passwordModal.classList.remove('active');
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
        newPasswordErrorMessage.textContent = '';
        setTimeout(() => newPasswordInput.focus(), 350);
    }

    if (setNewPasswordBtn) {
        setNewPasswordBtn.addEventListener('click', () => {
            const newPass = newPasswordInput.value;
            const confirmPass = confirmNewPasswordInput.value;

            if (!newPass || !confirmPass) {
                newPasswordErrorMessage.textContent = 'Please fill in both password fields.';
                return;
            }
            if (newPass.length < 4) {
                newPasswordErrorMessage.textContent = 'Password must be at least 4 characters long.';
                return;
            }
            if (newPass !== confirmPass) {
                newPasswordErrorMessage.textContent = 'Passwords do not match.';
                return;
            }

            VAULT_PASSWORD = newPass;
            localStorage.setItem('VAULT_PASSWORD', newPass);
            sessionStorage.setItem('vaultUnlocked', 'true');

            setNewPasswordModal.classList.remove('active');
            setTimeout(() => {
                hideElement(setNewPasswordModal);
                initializeVaultDisplay();
            }, 300);
        });
    }

    // Event listeners for Enter key in new password fields
    if (newPasswordInput) {
        newPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmNewPasswordInput.focus();
            }
        });
    }
    if (confirmNewPasswordInput) {
        confirmNewPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                setNewPasswordBtn.click();
            }
        });
    }


    // --- Common UI Logic (Theme, Hamburger, Scroll-to-Top, Active Nav Link) ---
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

    const hamburger = document.getElementById("hamburger");
    const navLinks = document.querySelector(".nav-links");
    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("show");
        });
    }

    const currentPage = window.location.pathname.split('/').pop();
    const navLinksList = document.querySelectorAll('.nav-links a');
    navLinksList.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) {
            link.classList.add('active-nav-link');
        }
    });

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
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }


    // --- Common List Management Logic (Adapted for Vault) ---
    const maxVisible = 5;
    const expanded = {};
    let draggedItem = null;

    function getCurrentTimestamp() {
        const now = new Date();
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
        return new Intl.DateTimeFormat('en-US', options).format(now);
    }

    function getList(type) {
        let localStorageKey;
        if (type === 'vault-notes') {
            localStorageKey = 'notesList';
        } else if (type === 'vault-links') {
            localStorageKey = 'accountsList';
        } else {
            localStorageKey = `${type}List`;
        }
        const stored = localStorage.getItem(localStorageKey);
        return stored ? JSON.parse(stored) : [];
    }

    function saveList(type, list) {
        let localStorageKey;
        let lastUpdatedKey;
        if (type === 'vault-notes') {
            localStorageKey = 'notesList';
            lastUpdatedKey = 'notesListLastUpdated';
        } else if (type === 'vault-links') {
            localStorageKey = 'accountsList';
            lastUpdatedKey = 'accountsListLastUpdated';
        } else {
            localStorageKey = `${type}List`;
            lastUpdatedKey = `${type}LastUpdated`;
        }
        localStorage.setItem(localStorageKey, JSON.stringify(list));
        localStorage.setItem(lastUpdatedKey, getCurrentTimestamp());
    }

    function getListLastUpdated(type) {
        let lastUpdatedKey;
        if (type === 'vault-notes') {
            lastUpdatedKey = 'notesListLastUpdated';
        } else if (type === 'vault-links') {
            lastUpdatedKey = 'accountsListLastUpdated';
        } else {
            lastUpdatedKey = `${type}LastUpdated`;
        }
        return localStorage.getItem(lastUpdatedKey) || 'Never';
    }


    function setLastUpdatedDisplay(type) {
        const listElement = document.querySelector(`#${type}-list`);
        if (!listElement) return;

        const lastUpdatedDiv = listElement.closest('.card').querySelector('.card-footer .last-updated');
        if (lastUpdatedDiv) {
            lastUpdatedDiv.textContent = `Last updated: ${getListLastUpdated(type)}`;
        }
    }

    function createGenericItemElement(type, name) {
        const li = document.createElement('li');
        li.setAttribute('draggable', 'true');
        li.dataset.itemName = name;

        const itemTextSpan = document.createElement('span');
        itemTextSpan.className = 'item-text';
        itemTextSpan.textContent = name;
        li.appendChild(itemTextSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-actions';

        const editBtn = document.createElement('span');
        editBtn.textContent = 'Edit';
        editBtn.className = 'action-btn';
        editBtn.onclick = (event) => {
            event.stopPropagation();
            editGenericItem(li, name, type);
        };
        actionsDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'action-btn';
        deleteBtn.onclick = (event) => {
            event.stopPropagation();
            showConfirmModal(
                `Delete Item`,
                `Are you sure you want to delete "${name}"?`,
                () => {
                    let list = getList(type);
                    list = list.filter(item => item !== name);
                    saveList(type, list);
                    renderGenericList(type);
                },
                'Delete',
                'Cancel'
            );
        };
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(actionsDiv);

        li.addEventListener('dragstart', (e) => {
            draggedItem = { element: li, data: name, type: type };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', name);
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
                const draggedData = draggedItem.data;
                const dropTargetData = li.dataset.itemName;

                const draggedIndex = currentList.indexOf(draggedData);
                const dropTargetIndex = currentList.indexOf(dropTargetData);

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
        const ol = document.getElementById(`${type}-list`);
        if (!ol) return;

        ol.innerHTML = '';

        const h3Element = ol.parentElement.querySelector('h3');
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
            const messageText = type === 'vault-notes' ? 'No notes here yet! Add your first note above.' :
                                type === 'vault-links' ? 'No links here yet! Add your first link above.' :
                                'No items here yet!';
            emptyMessage.textContent = messageText;
            ol.appendChild(emptyMessage);
        } else {
            if (typeof expanded[`${type}`] === 'undefined') {
                expanded[`${type}`] = false;
            }

            const visibleList = expanded[`${type}`] ? list : list.slice(0, maxVisible);
            visibleList.forEach(item => {
                const li = createGenericItemElement(type, item);
                ol.appendChild(li);
            });
        }

        const viewBtn = ol.nextElementSibling;
        if (viewBtn && viewBtn.classList.contains('view-more')) {
            viewBtn.style.display = list.length > maxVisible ? 'inline-block' : 'none';
            viewBtn.textContent = expanded[`${type}`] ? 'View Less' : 'View More';
        }

        setLastUpdatedDisplay(type);
    }

    window.addItem = function(type) {
        const input = document.getElementById(`${type}-input`);
        if (!input) return;

        const value = input.value.trim();
        if (!value) {
            input.classList.add('input-error');
            setTimeout(() => { input.classList.remove('input-error'); }, 1500);
            return;
        }

        const list = getList(type);
        if (list.includes(value)) {
            showConfirmModal('Duplicate Entry', 'This item already exists in the list!', () => {}, 'OK', 'Dismiss');
            input.classList.add('input-error');
            setTimeout(() => { input.classList.remove('input-error'); }, 1500);
            return;
        }
        list.push(value);
        saveList(type, list);
        input.value = '';
        renderGenericList(type);
        input.focus();
    };

    window.clearList = function(type) {
        showConfirmModal(
            `Clear All ${type.replace('vault-', '').charAt(0).toUpperCase() + type.replace('vault-', '').slice(1)}`,
            `Are you sure you want to clear all items from the ${type.replace('vault-', '')} list? This action cannot be undone.`,
            () => {
                console.log(`Clearing ${type} list...`);
                saveList(type, []); // Save an empty array
                renderGenericList(type);
            },
            'Yes, Clear All',
            'No, Keep It'
        );
    };

    function editGenericItem(li, oldName, type) {
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
                setTimeout(() => { nameInput.classList.remove('input-error'); }, 1500);
                return;
            }

            let list = getList(type);
            if (newName !== oldName && list.includes(newName)) {
                showConfirmModal('Duplicate Entry', 'An item with this name already exists!', () => {}, 'OK', 'Dismiss');
                input.classList.add('input-error');
                setTimeout(() => { input.classList.remove('input-error'); }, 1500);
                return;
            }

            list = list.map(item => item === oldName ? newName : item);
            saveList(type, list);
            li.classList.remove('editing-item');
            renderGenericList(type);
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
        renderGenericList(type);
    };


    // --- Initial setup on page load ---
    initializeVaultDisplay(); // Call this once when the DOM is ready

    // This ensures JS re-executes or re-checks the state when returning to the page from cache (browser back/forward)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) { // persisted indicates if the page was loaded from cache
            console.log('Page loaded from cache (persisted). Re-initializing vault display.');
            initializeVaultDisplay();
        }
    });

}); // End DOMContentLoaded