/**
 * inkdrop - Minimalist Note-Taking PWA
 *
 * A lightweight, offline-capable note-taking application with:
 * - Real-time auto-save with debouncing
 * - Intelligent search across title and content
 * - Bulk operations with custom modals
 * - Export functionality for data portability
 * - PWA features for native app experience
 * - Responsive design optimized for mobile
 *
 * Author: mosaddiq
 * Version: 2025.1.0
 */

/**
 * Main application class for inkdrop note-taking app
 * Handles all note operations, UI state, and data persistence
 */
class NoteApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentId = null;
        // Debouncing timeouts to prevent excessive saves/searches
        this.saveTimeout = null;
        this.searchTimeout = null;
        // UI state tracking for better UX
        this.isTyping = false;
        this.isOnline = navigator.onLine;
        // Prevent memory issues and maintain performance with large notes
        this.maxNoteLength = 50000;
        this.maxTitleLength = 1000;
        // Bulk selection state for multi-note operations
        this.selectionMode = false;
        this.selectedNotes = new Set();
        this.init();
    }
    /**
     * Safely loads notes from localStorage with validation
     * Handles corrupted data gracefully to prevent app crashes
     */
    loadNotes() {
        try {
            const stored = localStorage.getItem('notes');
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            // Ensure data integrity - localStorage can be corrupted by other scripts
            if (!Array.isArray(parsed)) {
                this.logError('Invalid notes format in localStorage');
                return [];
            }

            // Filter out any corrupted note objects to maintain app stability
            return parsed.filter(note => this.validateNote(note));
        } catch (error) {
            // Graceful degradation - start fresh rather than crash
            this.logError('Failed to load notes from localStorage', error);
            this.showNotification('Failed to load notes. Starting fresh.', 'error');
            return [];
        }
    }
    init() {
        this.bindEvents();
        this.render();
        this.setupSync();
        this.setupOfflineHandling();
        this.handlePWAShortcuts();
        this.setupErrorHandling();
    }
    /**
     * Validates note object structure and content limits
     * Prevents corrupted data from breaking the application
     * Essential for data integrity when loading from localStorage or imports
     */
    validateNote(note) {
        if (!note || typeof note !== 'object') return false;
        // Enforce title length limit to prevent UI layout issues
        if (note.title && (typeof note.title !== 'string' || note.title.length > this.maxTitleLength)) return false;
        // Enforce content length limit to prevent memory issues and maintain performance
        if (note.content && (typeof note.content !== 'string' || note.content.length > this.maxNoteLength)) return false;
        // Ensure ID is string for consistent comparison operations
        if (note.id && typeof note.id !== 'string') return false;
        return true;
    }
    logError(message, error = null) {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.error(message, error);
        }
    }
    logInfo(message, data = null) {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log(message, data);
        }
    }
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logError('Global error:', event.error);
            this.showNotification('Something went wrong. Please refresh the page.', 'error');
        });
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled promise rejection:', event.reason);
            this.showNotification('An error occurred. Please try again.', 'error');
        });
    }
    bindEvents() {
        $('#new').onclick = () => this.newNote();
        $('#back').onclick = () => this.showList();
        $('#delete').onclick = () => this.showDeleteModal();
        $('#export-note-btn').onclick = () => this.exportCurrentNote();
        const selectModeBtn = $('#select-mode-btn');
        if (selectModeBtn) {
            selectModeBtn.onclick = () => this.toggleSelectionMode();
        }
        const selectAllBtn = $('#select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.onclick = () => this.selectAll();
        }
        const deselectAllBtn = $('#deselect-all-btn');
        if (deselectAllBtn) {
            deselectAllBtn.onclick = () => this.deselectAll();
        }
        const bulkExportBtn = $('#bulk-export-btn');
        if (bulkExportBtn) {
            bulkExportBtn.onclick = () => this.bulkExportSelected();
        }
        const bulkDeleteBtn = $('#bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.onclick = () => this.bulkDeleteSelected();
        }
        const exitSelectBtn = $('#exit-select-btn');
        if (exitSelectBtn) {
            exitSelectBtn.onclick = () => this.exitSelectionMode();
        }
        const settingsBtn = $('#settings-btn');
        if (settingsBtn) {
            settingsBtn.onclick = () => this.showSettingsModal();
        }
        const settingsClose = $('#settings-close');
        if (settingsClose) {
            settingsClose.onclick = () => this.hideSettingsModal();
        }
        const exportJsonBtn = $('#export-all-json');
        if (exportJsonBtn) {
            exportJsonBtn.onclick = () => this.exportAllNotesJSON();
        }
        const importDataBtn = $('#import-data');
        if (importDataBtn) {
            importDataBtn.onclick = () => $('#import-file').click();
        }
        const importFile = $('#import-file');
        if (importFile) {
            importFile.onchange = (e) => {
                if (e.target.files[0]) {
                    this.importNotes(e.target.files[0]);
                    e.target.value = '';
                }
            };
        }
        $('#search').oninput = (e) => this.handleSearch(e.target.value);
        $('#clear').onclick = () => this.clearSearch();
        $('#title').oninput = () => this.handleInput();
        $('#content').oninput = () => this.handleInput();
        $('#title').onkeydown = $('#content').onkeydown = () => this.startTyping();
        $('#title').onkeyup = $('#content').onkeyup = () => this.stopTyping();
        $('#modal-cancel').onclick = () => this.hideDeleteModal();
        $('#modal-delete').onclick = () => this.confirmDelete();
        $('#modal').onclick = (e) => {
            if (e.target === $('#modal')) this.hideDeleteModal();
        };
        const settingsModal = $('#settings-modal');
        if (settingsModal) {
            settingsModal.onclick = (e) => {
                if (e.target === settingsModal) this.hideSettingsModal();
            };
        }
        document.onkeydown = (e) => this.handleKeyboard(e);
        window.onfocus = () => this.syncFromStorage();
        window.addEventListener('storage', (e) => {
            if (e.key === 'notes') this.syncFromStorage();
        });
    }
    setupOfflineHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineStatus();
            this.showNotification('Back online!', 'success');
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
            this.showNotification('You are offline. Changes will be saved locally.', 'warning');
        });
        this.updateOnlineStatus();
    }
    updateOnlineStatus() {
        const statusElement = document.getElementById('online-status');
        if (statusElement) {
            statusElement.textContent = this.isOnline ? '' : 'Offline';
            statusElement.className = this.isOnline ? 'online-status' : 'online-status offline';
        }
    }
    /**
     * Debounced search handler to prevent excessive filtering
     * 150ms delay provides responsive feel while avoiding performance issues
     */
    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        const clearBtn = $('#clear');
        clearBtn.style.display = query.trim() ? 'block' : 'none';

        // Debounce search to avoid filtering on every keystroke
        // 150ms is optimal balance between responsiveness and performance
        this.searchTimeout = setTimeout(() => {
            this.search(query);
        }, 150);
    }
    clearSearch() {
        $('#search').value = '';
        $('#clear').style.display = 'none';
        this.search('');
    }
    startTyping() {
        this.isTyping = true;
        this.showStatus('typing...');
    }
    stopTyping() {
        setTimeout(() => {
            this.isTyping = false;
        }, 100);
    }
    handleInput() {
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        if (title.length > this.maxTitleLength) {
            document.getElementById('title').value = title.substring(0, this.maxTitleLength);
            this.showNotification(`Title limited to ${this.maxTitleLength} characters`, 'warning');
        }
        if (content.length > this.maxNoteLength) {
            document.getElementById('content').value = content.substring(0, this.maxNoteLength);
            this.showNotification(`Note limited to ${this.maxNoteLength} characters`, 'warning');
        }
        this.updateCount();
        this.showStatus('saving...');
        this.autoSave();
    }
    autoSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            if (this.currentId) {
                this.saveNote(false);
                this.showStatus('saved');
                setTimeout(() => this.hideStatus(), 1500);
            }
        }, 300);
    }
    showStatus(text) {
        const status = $('#status');
        status.textContent = text;
        status.className = `status show ${text.includes('saving') ? 'saving' : 'saved'}`;
    }
    hideStatus() {
        $('#status').className = 'status';
    }
    newNote() {
        this.currentId = Date.now().toString();
        this.showEditor({
            id: this.currentId,
            title: '',
            content: '',
            created: new Date(),
            updated: new Date()
        });
    }
    showList() {
        $('#list').classList.add('active');
        $('#editor').classList.remove('active');
        this.currentId = null;
        this.clearSearch();
        this.render();
    }
    showEditor(note) {
        $('#list').classList.remove('active');
        $('#editor').classList.add('active');
        $('#title').value = note.title || '';
        $('#content').value = note.content || '';
        $('#date').textContent = this.formatDate(note.updated || note.created);
        this.updateCount();
        this.hideStatus();
        setTimeout(() => {
            if (!note.title) {
                $('#title').focus();
            } else {
                $('#content').focus();
            }
        }, 100);
    }
    saveNote(showFeedback = true) {
        if (!this.currentId) return;
        try {
            const title = $('#title').value.trim();
            const content = $('#content').value.trim();
            if (!title && !content) {
                if (showFeedback) this.showList();
                return;
            }
            const noteData = {
                id: this.currentId,
                title: title || 'untitled',
                content: content,
                updated: new Date()
            };
            if (!this.validateNote(noteData)) {
                this.showNotification('Invalid note data. Please check your input.', 'error');
                return;
            }
            const existing = this.notes.findIndex(n => n.id === this.currentId);
            if (existing >= 0) {
                this.notes[existing] = { ...this.notes[existing], ...noteData };
            } else {
                noteData.created = new Date();
                this.notes.unshift(noteData);
            }
            this.store();
            if (showFeedback) {
                this.showStatus('saved');
                setTimeout(() => this.hideStatus(), 1500);
            }
            $('#date').textContent = this.formatDate(noteData.updated);
        } catch (error) {
            this.logError('Failed to save note', error);
            this.showNotification('Failed to save note. Please try again.', 'error');
        }
    }
    showDeleteModal() {
        if (!this.currentId) return;
        const title = $('#title').value.trim() || 'untitled';
        const content = $('#content').value.trim() || 'no content';
        $('#modal-title').textContent = title;
        $('#modal-preview').textContent = content;
        $('#modal').classList.add('show');
        setTimeout(() => $('#modal-cancel').focus(), 100);
    }
    hideDeleteModal() {
        $('#modal').classList.remove('show');
    }
    confirmDelete() {
        if (!this.currentId) return;
        this.notes = this.notes.filter(n => n.id !== this.currentId);
        this.store();
        this.hideDeleteModal();
        this.showList();
    }
    showSettingsModal() {
        $('#settings-modal').classList.add('show');
        setTimeout(() => $('#settings-close').focus(), 100);
    }
    hideSettingsModal() {
        $('#settings-modal').classList.remove('show');
    }
    toggleSelectionMode() {
        this.selectionMode = !this.selectionMode;
        this.selectedNotes.clear();
        this.updateSelectionUI();
        this.render();
    }
    exitSelectionMode() {
        this.selectionMode = false;
        this.selectedNotes.clear();
        this.updateSelectionUI();
        this.render();
    }
    selectAll() {
        this.notes.forEach(note => this.selectedNotes.add(note.id));
        this.updateSelectionUI();
        this.render();
    }
    deselectAll() {
        this.selectedNotes.clear();
        this.updateSelectionUI();
        this.render();
    }
    toggleNoteSelection(noteId) {
        if (this.selectedNotes.has(noteId)) {
            this.selectedNotes.delete(noteId);
        } else {
            this.selectedNotes.add(noteId);
        }
        this.updateSelectionUI();
        this.render();
    }
    updateSelectionUI() {
        const bulkBar = $('#bulk-bar');
        const selectedCount = $('#selected-count');
        if (this.selectionMode) {
            bulkBar.style.display = 'flex';
            selectedCount.textContent = `${this.selectedNotes.size} selected`;
        } else {
            bulkBar.style.display = 'none';
        }
    }
    async bulkExportSelected() {
        if (this.selectedNotes.size === 0) {
            this.showNotification('No notes selected!', 'warning');
            return;
        }
        try {
            const selectedNotesData = this.notes.filter(note => this.selectedNotes.has(note.id));
            if (selectedNotesData.length === 1) {
                this.exportSingleNoteTXT(selectedNotesData[0]);
            } else {
                this.exportMultipleNotesArchive(selectedNotesData);
            }
        } catch (error) {
            this.logError('Failed to export selected notes', error);
            this.showNotification('Failed to export selected notes. Please try again.', 'error');
        }
    }
    exportSingleNoteTXT(note) {
        const title = note.title || 'Untitled';
        const date = new Date(note.updated || note.created).toLocaleDateString();
        const content = note.content || '';
        const noteText = `${title}\n${'='.repeat(title.length)}\n\nCreated: ${date}\n\n${content}`;
        const blob = new Blob([noteText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.sanitizeFilename(title)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Note exported as TXT file!', 'success');
    }
    /**
     * Creates a human-readable archive file from multiple notes
     * Uses plain text format for universal compatibility and readability
     */
    exportMultipleNotesArchive(notes) {
        try {
            this.showNotification('Creating archive file...', 'info');

            // Create archive header with metadata for user reference
            let archiveContent = `INKDROP NOTES ARCHIVE\n`;
            archiveContent += `Exported: ${new Date().toLocaleString()}\n`;
            archiveContent += `Total Notes: ${notes.length}\n\n`;
            archiveContent += `${'═'.repeat(50)}\n\n`;

            // Process each note with clear visual separation
            notes.forEach((note, index) => {
                const title = note.title || 'Untitled';
                // Fallback to created date if updated is missing
                const date = new Date(note.updated || note.created).toLocaleDateString();
                const content = note.content || '';

                // Add separator between notes (except for first note)
                if (index > 0) {
                    archiveContent += `\n${'═'.repeat(50)}\n\n`;
                }

                // Format each note with numbered header and underline
                archiveContent += `${index + 1}. ${title}\n`;
                archiveContent += `${'─'.repeat(title.length + 3)}\n`;
                archiveContent += `Date: ${date}\n\n`;
                archiveContent += `${content}\n`;
            });
            const blob = new Blob([archiveContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inkdrop-notes-${new Date().toISOString().split('T')[0]}.txt`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            this.showNotification(`Exported ${notes.length} notes as archive!`, 'success');
        } catch (error) {
            this.logError('Failed to create archive file', error);
            this.showNotification('Failed to create archive file. Please try again.', 'error');
        }
    }
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9\s-]/gi, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase()
            .substring(0, 50)
            .replace(/^-+|-+$/g, '') || 'untitled';
    }
    bulkDeleteSelected() {
        if (this.selectedNotes.size === 0) {
            this.showNotification('No notes selected!', 'warning');
            return;
        }
        const count = this.selectedNotes.size;
        this.showBulkDeleteModal(count);
    }

    /**
     * Shows custom bulk delete confirmation modal
     * Uses setTimeout to ensure DOM elements are available after render
     */
    showBulkDeleteModal(count) {
        // Micro-task delay ensures DOM is ready after any pending renders
        setTimeout(() => {
            const modal = document.getElementById('bulk-delete-modal');
            const countDisplay = document.getElementById('bulk-delete-count');

            // Graceful degradation if modal elements aren't found
            if (!modal || !countDisplay) {
                return;
            }

            // Update count display with proper pluralization
            countDisplay.textContent = `${count} note${count > 1 ? 's' : ''} selected`;
            // Two-step modal show: display for layout, then show class for animation
            modal.style.display = 'flex';
            modal.classList.add('show');

            const cancelBtn = document.getElementById('bulk-modal-cancel');
            const deleteBtn = document.getElementById('bulk-modal-delete');

            if (!cancelBtn || !deleteBtn) {
                return;
            }

            const handleCancel = () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 200);
                cancelBtn.removeEventListener('click', handleCancel);
                deleteBtn.removeEventListener('click', handleDelete);
            };

            const handleDelete = () => {
                this.notes = this.notes.filter(note => !this.selectedNotes.has(note.id));
                this.selectedNotes.clear();
                this.store();
                this.render();
                this.updateSelectionUI();
                this.showNotification(`Deleted ${count} note${count > 1 ? 's' : ''}!`, 'success');
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 200);
                cancelBtn.removeEventListener('click', handleCancel);
                deleteBtn.removeEventListener('click', handleDelete);
            };

            cancelBtn.addEventListener('click', handleCancel);
            deleteBtn.addEventListener('click', handleDelete);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            });
        }, 0);
    }

    search(query) {
        const filtered = query.trim()
            ? this.notes.filter(n => {
                const q = query.toLowerCase();
                return n.title.toLowerCase().includes(q) ||
                    n.content.toLowerCase().includes(q);
            })
            : this.notes;
        this.renderNotes(filtered);
    }
    handleKeyboard(e) {
        if ($('#modal').classList.contains('show')) {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.hideDeleteModal();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmDelete();
                return;
            }
            return;
        }
        if ($('#settings-modal').classList.contains('show')) {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.hideSettingsModal();
                return;
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (this.currentId) this.saveNote(true);
        }
        if (e.key === 'Escape') {
            this.showList();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.newNote();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if ($('#list').classList.contains('active')) {
                $('#search').focus();
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && $('#list').classList.contains('active')) {
            e.preventDefault();
            if (!this.selectionMode) {
                this.toggleSelectionMode();
            }
            this.selectAll();
        }
    }
    setupSync() {
        this.syncInterval = setInterval(() => this.syncFromStorage(), 30000);
        window.addEventListener('beforeunload', () => {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
            }
        });
    }
    syncFromStorage() {
        try {
            const stored = this.loadNotes();
            if (JSON.stringify(stored) !== JSON.stringify(this.notes)) {
                this.notes = stored;
                this.render();
                this.logInfo('Notes synced from storage');
            }
        } catch (error) {
            this.logError('Failed to sync from storage', error);
        }
    }
    render() {
        this.renderNotes(this.notes);
    }
    renderNotes(notes) {
        const container = $('#notes');
        if (notes.length === 0) {
            container.innerHTML = `
                <div class="empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <p>no notes yet</p>
                    <span>press + to create your first note</span>
                </div>
            `;
            return;
        }
        container.innerHTML = notes.map(note => {
            const isSelected = this.selectedNotes.has(note.id);
            const selectedClass = isSelected ? 'selected' : '';
            return `
                <div class="note ${selectedClass}" data-id="${note.id}">
                    ${this.selectionMode ? `
                        <div class="note-checkbox ${isSelected ? 'checked' : ''}" data-note-id="${note.id}"></div>
                    ` : ''}
                    <div class="note-content">
                        <div class="note-title">${this.escape(note.title || 'untitled')}</div>
                        <div class="note-preview">${this.escape(note.content || 'no content')}</div>
                        <div class="note-date">${this.formatDate(note.updated || note.created)}</div>
                    </div>
                </div>
            `;
        }).join('');
        container.querySelectorAll('.note').forEach(el => {
            el.onclick = (e) => {
                if (this.selectionMode) {
                    e.preventDefault();
                    this.toggleNoteSelection(el.dataset.id);
                } else {
                    const note = this.notes.find(n => n.id === el.dataset.id);
                    if (note) {
                        this.currentId = note.id;
                        this.showEditor(note);
                    }
                }
            };
        });
        container.querySelectorAll('.note-checkbox').forEach(checkbox => {
            checkbox.onclick = (e) => {
                e.stopPropagation();
                this.toggleNoteSelection(checkbox.dataset.noteId);
            };
        });
    }
    updateCount() {
        const count = $('#content').value.length;
        $('#count').textContent = `${count} character${count !== 1 ? 's' : ''}`;
    }
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'today';
        if (diff === 1) return 'yesterday';
        if (diff < 7) return `${diff}d ago`;
        return d.toLocaleDateString();
    }
    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    store() {
        try {
            const data = JSON.stringify(this.notes);
            localStorage.setItem('notes', data);
            const saved = localStorage.getItem('notes');
            if (!saved || saved !== data) {
                throw new Error('Data verification failed');
            }
        } catch (error) {
            this.logError('Failed to save notes to localStorage', error);
            this.showNotification('Failed to save changes. Storage may be full.', 'error');
            try {
                localStorage.removeItem('notes');
                localStorage.setItem('notes', JSON.stringify(this.notes));
            } catch (retryError) {
                this.logError('Retry save also failed', retryError);
                this.showNotification('Critical: Unable to save data. Please export your notes.', 'error');
            }
        }
    }
    handlePWAShortcuts() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        switch (action) {
            case 'new':
                this.newNote();
                break;
            case 'search':
                this.showList();
                setTimeout(() => document.getElementById('search').focus(), 100);
                break;
            case 'share':
                this.handleShareTarget();
                break;
            case 'open':
                this.handleFileOpen();
                break;
            case 'protocol':
                this.handleProtocol();
                break;
        }
    }
    handleShareTarget() {
        const urlParams = new URLSearchParams(window.location.search);
        const title = urlParams.get('title') || '';
        const text = urlParams.get('text') || '';
        const url = urlParams.get('url') || '';
        if (title || text || url) {
            this.currentId = Date.now().toString();
            const content = [title, text, url].filter(Boolean).join('\n\n');
            this.showEditor({
                id: this.currentId,
                title: title || 'Shared Note',
                content: content,
                created: new Date(),
                updated: new Date()
            });
        }
    }
    handleFileOpen() {
        this.logInfo('File open requested');
    }
    handleProtocol() {
        const urlParams = new URLSearchParams(window.location.search);
        const protocolUrl = urlParams.get('url');
        this.logInfo('Protocol handler:', protocolUrl);
    }
    exportCurrentNote() {
        if (!this.currentId) return;
        try {
            const title = $('#title').value.trim() || 'untitled';
            const content = $('#content').value.trim() || '';
            const date = new Date().toLocaleDateString();
            const noteText = `${title}\n${'='.repeat(title.length)}\n\nCreated: ${date}\n\n${content}`;
            const blob = new Blob([noteText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showNotification('Note exported as text!', 'success');
        } catch (error) {
            this.logError('Failed to export note', error);
            this.showNotification('Failed to export note. Please try again.', 'error');
        }
    }
    exportAllNotesJSON() {
        try {
            const data = {
                notes: this.notes,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inkdrop-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.hideSettingsModal();
            this.showNotification('Backup created successfully!', 'success');
        } catch (error) {
            this.logError('Failed to create backup', error);
            this.showNotification('Failed to create backup. Please try again.', 'error');
        }
    }
    exportAllNotesTXT() {
        try {
            if (this.notes.length === 0) {
                this.showNotification('No notes to export!', 'warning');
                return;
            }
            const exportText = this.notes.map((note, index) => {
                const title = note.title || 'Untitled';
                const date = new Date(note.updated || note.created).toLocaleDateString();
                const content = note.content || '';
                return `${index + 1}. ${title}\n${'='.repeat(title.length + 3)}\nDate: ${date}\n\n${content}\n\n${'─'.repeat(50)}\n`;
            }).join('\n');
            const header = `INKDROP NOTES EXPORT\nExported: ${new Date().toLocaleString()}\nTotal Notes: ${this.notes.length}\n\n${'═'.repeat(50)}\n\n`;
            const fullText = header + exportText;
            const blob = new Blob([fullText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inkdrop-notes-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.hideSettingsModal();
            this.showNotification(`Exported ${this.notes.length} notes as text!`, 'success');
        } catch (error) {
            this.logError('Failed to export notes as text', error);
            this.showNotification('Failed to export notes. Please try again.', 'error');
        }
    }
    importNotes(file) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.notes && Array.isArray(data.notes)) {
                        const validNotes = data.notes.filter(note => this.validateNote(note));
                        this.notes = [...this.notes, ...validNotes];
                        this.store();
                        this.render();
                        this.showNotification(`Imported ${validNotes.length} notes successfully!`, 'success');
                    } else {
                        throw new Error('Invalid file format');
                    }
                } catch (parseError) {
                    this.logError('Failed to parse import file', parseError);
                    this.showNotification('Invalid file format. Please select a valid inkdrop export file.', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            this.logError('Failed to import notes', error);
            this.showNotification('Failed to import notes. Please try again.', 'error');
        }
    }
}
// Utility function for DOM element selection
const $ = (selector) => document.querySelector(selector);

// Initialize the application
new NoteApp();
