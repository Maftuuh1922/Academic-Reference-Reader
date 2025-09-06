// Folder Management JavaScript

let userFolders = [];
let selectedFolderId = null;

// Load user folders
async function loadUserFolders() {
    if (!isAuthenticated()) return;
    
    try {
        const response = await fetch('/api/folders', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            userFolders = data.folders;
            renderFolders();
        } else {
            console.error('Failed to load folders');
        }
    } catch (error) {
        console.error('Error loading folders:', error);
    }
}

// Render folders in the UI
function renderFolders() {
    const folderList = document.getElementById('folderList');
    
    if (userFolders.length === 0) {
        folderList.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <i class="fas fa-folder-plus text-4xl mb-3"></i>
                <p>Belum ada folder. Klik "Buat Folder" untuk memulai!</p>
            </div>
        `;
        return;
    }
    
    folderList.innerHTML = userFolders.map(folder => `
        <div class="folder-card bg-white rounded-lg border-2 border-gray-200 hover:border-${getColorName(folder.color)}-300 transition-all cursor-pointer p-4"
             onclick="selectFolder('${folder._id}')"
             data-folder-id="${folder._id}">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                    <i class="fas ${folder.icon || 'fa-folder'} text-2xl mr-3" style="color: ${folder.color}"></i>
                    <div>
                        <h3 class="font-semibold text-gray-800">${folder.name}</h3>
                        <p class="text-sm text-gray-500">${folder.referenceCount || 0} referensi</p>
                    </div>
                </div>
                <div class="flex space-x-1">
                    <button onclick="editFolder('${folder._id}'); event.stopPropagation();" 
                            class="text-gray-400 hover:text-gray-600 p-1">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button onclick="deleteFolder('${folder._id}'); event.stopPropagation();" 
                            class="text-gray-400 hover:text-red-600 p-1">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
            ${folder.description ? `<p class="text-sm text-gray-600 line-clamp-2">${folder.description}</p>` : ''}
            <div class="mt-3 flex justify-between items-center">
                <span class="text-xs text-gray-400">
                    ${folder.isDefault ? '<i class="fas fa-star mr-1"></i>Default' : ''}
                </span>
                ${folder.googleDriveId ? '<i class="fab fa-google-drive text-green-600 text-sm" title="Tersinkron dengan Google Drive"></i>' : ''}
            </div>
        </div>
    `).join('');
}

// Get color name from hex for Tailwind classes
function getColorName(hexColor) {
    const colorMap = {
        '#3B82F6': 'blue',
        '#10B981': 'green',
        '#F59E0B': 'yellow',
        '#EF4444': 'red',
        '#8B5CF6': 'purple',
        '#F97316': 'orange',
        '#6B7280': 'gray'
    };
    return colorMap[hexColor] || 'blue';
}

// Select folder
function selectFolder(folderId) {
    selectedFolderId = folderId;
    
    // Update UI to show selected folder
    document.querySelectorAll('.folder-card').forEach(card => {
        card.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
    });
    
    const selectedCard = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
    }
    
    // Filter references by folder
    if (typeof loadReferences === 'function') {
        loadReferences({ folderId });
    }
    
    const folder = userFolders.find(f => f._id === folderId);
    showNotification(`Menampilkan referensi dari folder: ${folder?.name}`, 'info');
}

// Show folder modal
function showFolderModal(editFolderId = null) {
    const modal = document.getElementById('folderModal');
    const form = document.getElementById('folderForm');
    const title = document.getElementById('folderModalTitle');
    
    if (editFolderId) {
        // Edit mode
        const folder = userFolders.find(f => f._id === editFolderId);
        if (folder) {
            title.textContent = 'Edit Folder';
            document.getElementById('folderName').value = folder.name;
            document.getElementById('folderDescription').value = folder.description || '';
            document.getElementById('folderIcon').value = folder.icon || 'fa-folder';
            document.getElementById('folderColor').value = folder.color || '#3B82F6';
            form.dataset.editId = editFolderId;
        }
    } else {
        // Create mode
        title.textContent = 'Buat Folder Baru';
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.classList.remove('hidden');
}

// Close folder modal
function closeFolderModal() {
    document.getElementById('folderModal').classList.add('hidden');
    document.getElementById('folderForm').reset();
}

// Edit folder
function editFolder(folderId) {
    showFolderModal(folderId);
}

// Delete folder
async function deleteFolder(folderId) {
    const folder = userFolders.find(f => f._id === folderId);
    
    if (!confirm(`Apakah Anda yakin ingin menghapus folder "${folder?.name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/folders/${folderId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showNotification('Folder berhasil dihapus', 'success');
            loadUserFolders();
            
            // Clear selection if deleted folder was selected
            if (selectedFolderId === folderId) {
                selectedFolderId = null;
                if (typeof loadReferences === 'function') {
                    loadReferences();
                }
            }
        } else {
            const data = await response.json();
            showNotification(data.error || 'Gagal menghapus folder', 'error');
        }
    } catch (error) {
        console.error('Error deleting folder:', error);
        showNotification('Terjadi kesalahan saat menghapus folder', 'error');
    }
}

// Handle folder form submission
document.getElementById('folderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('folderName').value,
        description: document.getElementById('folderDescription').value,
        icon: document.getElementById('folderIcon').value,
        color: document.getElementById('folderColor').value
    };
    
    const editId = this.dataset.editId;
    const isEdit = !!editId;
    
    try {
        const url = isEdit ? `/api/folders/${editId}` : '/api/folders';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const message = isEdit ? 'Folder berhasil diperbarui' : 'Folder berhasil dibuat';
            showNotification(message, 'success');
            closeFolderModal();
            loadUserFolders();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Gagal menyimpan folder', 'error');
        }
    } catch (error) {
        console.error('Error saving folder:', error);
        showNotification('Terjadi kesalahan saat menyimpan folder', 'error');
    }
});

// Toggle Google Drive sync
function toggleGoogleDriveSync() {
    if (!isAuthenticated()) {
        showNotification('Silakan login terlebih dahulu', 'warning');
        return;
    }
    
    // For now, show a placeholder message
    showNotification('Fitur sinkronisasi Google Drive akan segera hadir! Saat ini referensi disimpan secara lokal dengan backup otomatis.', 'info');
}

// Move references to folder
async function moveReferencesToFolder(referenceIds, targetFolderId) {
    if (!isAuthenticated()) return false;
    
    try {
        const response = await fetch(`/api/folders/${targetFolderId}/move-references`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ referenceIds })
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification(data.message, 'success');
            loadUserFolders(); // Refresh folder counts
            return true;
        } else {
            const data = await response.json();
            showNotification(data.error || 'Gagal memindahkan referensi', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error moving references:', error);
        showNotification('Terjadi kesalahan saat memindahkan referensi', 'error');
        return false;
    }
}

// Get current selected folder
function getSelectedFolder() {
    return selectedFolderId ? userFolders.find(f => f._id === selectedFolderId) : null;
}

// Clear folder selection
function clearFolderSelection() {
    selectedFolderId = null;
    document.querySelectorAll('.folder-card').forEach(card => {
        card.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
    });
}
