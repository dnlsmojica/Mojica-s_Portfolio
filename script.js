const categories = ['skills', 'activities', 'exam', 'laboratory', 'projects', 'quizzes'];

document.addEventListener('DOMContentLoaded', () => {
  categories.forEach(cat => renderCategoryFiles(cat));

  // Close modal when clicking outside the modal box
  const modal = document.getElementById('file-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('close-modal')) {
        closeModal();
      }
    });
  }
});

function switchTab(tabName) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase() === tabName.toLowerCase()) {
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.tab-page').forEach(page => {
    page.classList.remove('active');
  });

  const activePage = document.getElementById(`tab-${tabName}`);
  if (activePage) {
    activePage.classList.add('active');
  }

  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    if (tabName === 'home') {
      backBtn.classList.add('hidden');
    } else {
      backBtn.classList.remove('hidden');
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
  switchTab('home');
}

function uploadFile(category, event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const fileObj = {
      id: Date.now(),
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      badgeLabel: file.name.split('.').pop().toUpperCase(),
      data: e.target.result,
      // Format changed to numerical (e.g., 09/02/2026 or 9/2/2026)
      date: new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
    };

    saveFile(category, fileObj);
    renderCategoryFiles(category);
  };

  reader.readAsDataURL(file);
  event.target.value = '';
}

function getStoredFiles(category) {
  const data = localStorage.getItem(`archive_${category}`);
  return data ? JSON.parse(data) : [];
}

function saveFile(category, fileObj) {
  try {
    const files = getStoredFiles(category);
    files.push(fileObj);
    localStorage.setItem(`archive_${category}`, JSON.stringify(files));
  } catch (e) {
    // Replaces the native browser alert with custom modal call
    showCustomAlert('File Too Large', 'File too large for local storage. Try a smaller file.');
  }
}

// Custom Alert Modal Handler
function showCustomAlert(titleText, messageText) {
  const modal = document.getElementById('file-modal');
  const modalBody = document.getElementById('modal-body');

  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div style="text-align: center; padding: 1.5rem;">
      <h3 style="color: #ff4d4d; margin-bottom: 1rem; font-size: 1.4rem;">${titleText}</h3>
      <p style="color: var(--text-primary); margin-bottom: 1.5rem; line-height: 1.5;">${messageText}</p>
      <button onclick="closeModal()" class="neon-btn" style="cursor: pointer; padding: 8px 24px;">OK</button>
    </div>
  `;

  modal.classList.remove('hidden');
}

// Variable to keep track of file pending deletion
let pendingDelete = null;

// Replace standard confirm() call
function deleteFile(category, id) {
  pendingDelete = { category, id };
  showCustomConfirm(
    'Delete File',
    'Are you sure you want to delete this file?'
  );
}

// Perform actual deletion when user clicks 'Confirm'
function confirmDelete() {
  if (!pendingDelete) return;

  const { category, id } = pendingDelete;
  let files = getStoredFiles(category);
  files = files.filter(f => f.id !== id);
  localStorage.setItem(`archive_${category}`, JSON.stringify(files));
  
  renderCategoryFiles(category);
  closeModal();
  pendingDelete = null;
}

// Render custom confirmation UI inside #file-modal
function showCustomConfirm(titleText, messageText) {
  const modal = document.getElementById('file-modal');
  const modalBody = document.getElementById('modal-body');

  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div style="text-align: center; padding: 1.5rem;">
      <h3 style="color: #ff4d4d; margin-bottom: 1rem; font-size: 1.4rem;">${titleText}</h3>
      <p style="color: var(--text-primary); margin-bottom: 1.5rem; line-height: 1.5;">${messageText}</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button onclick="confirmDelete()" class="neon-btn" style="cursor: pointer; padding: 8px 20px; background-color: #ff4d4d; border-color: #ff4d4d; color: #fff;">Delete</button>
        <button onclick="closeModal()" class="view-btn" style="cursor: pointer; padding: 8px 20px; width: auto;">Cancel</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function renderCategoryFiles(category) {
  const container = document.getElementById(`container-${category}`);
  if (!container) return;

  const files = getStoredFiles(category);

  if (files.length === 0) {
    container.innerHTML = `<p class="empty-msg"></p>`;
    return;
  }

  container.innerHTML = files.map(file => {
    const badge = file.badgeLabel || file.type || 'FILE';
    
    return `
      <div class="file-item-card">
        <div class="file-item-header">
          <span class="file-badge">${badge}</span>
          <button class="delete-btn" onclick="deleteFile('${category}', ${file.id})" title="Delete File">&times;</button>
        </div>
        <div class="file-info">
          <div class="file-title">${file.name}</div>
        </div>
        <button class="view-btn" onclick="openModal('${category}', ${file.id})">Open File</button>
      </div>
    `;
  }).join('');
}

// Modal View Handler looking up stored file by ID
function openModal(filePath) {
  const modal = document.getElementById('file-modal');
  const modalBody = document.getElementById('modal-body');
  
  // Get file extension
  const extension = filePath.split('.').pop().toLowerCase();
  
  // Clear previous modal content
  modalBody.innerHTML = '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    // Render image element inside modal
    modalBody.innerHTML = `<img src="${filePath}" alt="File Preview" style="max-width: 100%; max-height: 80vh; border-radius: 8px; display: block; margin: 0 auto;">`;
  } else if (extension === 'pdf') {
    // Render PDF embed inside modal
    modalBody.innerHTML = `<iframe src="${filePath}" style="width: 100%; height: 80vh; border: none; border-radius: 8px;"></iframe>`;
  } else {
    // Fallback for non-previewable files
    modalBody.innerHTML = `<p style="color: #fff; text-align: center;">Preview not available. <a href="${filePath}" download style="color: #00f2fe;">Click here to download</a>.</p>`;
  }

  // Display modal window
  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('file-modal');
  modal.classList.add('hidden');
}

function closeModal() {
  const modal = document.getElementById('file-modal');
  if (modal) modal.classList.add('hidden');
}

function openStaticFile(filePath, fileName) {
  const modal = document.getElementById('file-modal');
  const modalBody = document.getElementById('modal-body');
  
  // Get file extension
  const ext = fileName.split('.').pop().toLowerCase();
  
  modalBody.innerHTML = ''; // Clear previous content

  // Handle Images (JPG, PNG, GIF, WEBP)
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    modalBody.innerHTML = `<img src="${filePath}" alt="${fileName}" style="max-width: 100%; max-height: 80vh; display: block; margin: 0 auto; border-radius: 8px;">`;
  } 
  // Handle PDFs (Embeds inside an iframe)
  else if (ext === 'pdf') {
    modalBody.innerHTML = `<iframe src="${filePath}" style="width: 100%; height: 80vh; border: none; border-radius: 8px;"></iframe>`;
  } 
  // Fallback for unsupported file types (DOCX, ZIP, etc.)
  else {
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p style="color: #fff; margin-bottom: 15px;">Preview not available for this file type.</p>
        <a href="${filePath}" download class="view-btn" style="display: inline-block; width: auto; padding: 8px 20px;">Download ${fileName}</a>
      </div>
    `;
  }

  // Display the modal
  modal.classList.remove('hidden');
}

// Function to close modal
function closeModal() {
  const modal = document.getElementById('file-modal');
  modal.classList.add('hidden');
}