document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  
  if (!token || !userId) {
    alert('You must be logged in to upload documents');
    window.location.href = 'login.html';
    return;
  }
  
  // Handle logout
  document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userRole');
    window.location.href = 'login.html';
  });
  
  // Fetch existing documents
  fetchDocuments();
  
  // Handle ID verification form submission
  const idVerificationForm = document.getElementById('idVerificationForm');
  idVerificationForm.addEventListener('submit', function(event) {
    event.preventDefault();
    uploadDocument('identity', 'idDocument', 'idType');
  });
  
  // Handle address verification form submission
  const addressVerificationForm = document.getElementById('addressVerificationForm');
  addressVerificationForm.addEventListener('submit', function(event) {
    event.preventDefault();
    uploadDocument('address', 'addressDocument', 'addressDocType');
  });
  
  // Handle financial document form submission
  const financialDocumentForm = document.getElementById('financialDocumentForm');
  financialDocumentForm.addEventListener('submit', function(event) {
    event.preventDefault();
    uploadDocument('financial', 'financialDocument', 'financialDocType');
  });
  
  // Function to upload a document
  async function uploadDocument(category, fileInputId, typeInputId) {
    const fileInput = document.getElementById(fileInputId);
    const documentType = document.getElementById(typeInputId).value;
    
    if (!fileInput.files || fileInput.files.length === 0) {
      alert('Please select a file to upload');
      return;
    }
    
    const file = fileInput.files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', category);
    formData.append('documentType', documentType);
    formData.append('userId', userId);
    
    try {
      const response = await fetch('/user/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Document uploaded successfully!');
        // Reset form
        document.getElementById(fileInputId).value = '';
        document.getElementById(typeInputId).value = '';
        // Refresh document list
        fetchDocuments();
      } else {
        alert(data.message || 'Error uploading document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('An error occurred while uploading the document. Please try again.');
    }
  }
  
  // Function to fetch existing documents
  async function fetchDocuments() {
    try {
      const response = await fetch(`/user/documents/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const documents = await response.json();
        displayDocuments(documents);
      } else {
        document.getElementById('uploadedDocumentsContainer').innerHTML = `
          <p class="text-center">Failed to load documents. Please refresh the page.</p>
        `;
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      document.getElementById('uploadedDocumentsContainer').innerHTML = `
        <p class="text-center">Failed to load documents. Please refresh the page.</p>
      `;
    }
  }
  
  // Function to display documents
  function displayDocuments(documents) {
    const container = document.getElementById('uploadedDocumentsContainer');
    
    if (!documents || documents.length === 0) {
      container.innerHTML = `
        <p class="text-center">No documents uploaded yet.</p>
      `;
      return;
    }
    
    // Group documents by category
    const groupedDocuments = {
      identity: [],
      address: [],
      financial: []
    };
    
    documents.forEach(doc => {
      if (groupedDocuments[doc.category]) {
        groupedDocuments[doc.category].push(doc);
      } else {
        groupedDocuments.other = groupedDocuments.other || [];
        groupedDocuments.other.push(doc);
      }
    });
    
    let html = '';
    
    // Identity documents
    if (groupedDocuments.identity.length > 0) {
      html += `<h5>Identity Documents</h5>`;
      html += `<div class="row mb-3">`;
      
      groupedDocuments.identity.forEach(doc => {
        html += createDocumentCard(doc);
      });
      
      html += `</div>`;
    }
    
    // Address documents
    if (groupedDocuments.address.length > 0) {
      html += `<h5>Address Documents</h5>`;
      html += `<div class="row mb-3">`;
      
      groupedDocuments.address.forEach(doc => {
        html += createDocumentCard(doc);
      });
      
      html += `</div>`;
    }
    
    // Financial documents
    if (groupedDocuments.financial.length > 0) {
      html += `<h5>Financial Documents</h5>`;
      html += `<div class="row mb-3">`;
      
      groupedDocuments.financial.forEach(doc => {
        html += createDocumentCard(doc);
      });
      
      html += `</div>`;
    }
    
    // Other documents
    if (groupedDocuments.other && groupedDocuments.other.length > 0) {
      html += `<h5>Other Documents</h5>`;
      html += `<div class="row mb-3">`;
      
      groupedDocuments.other.forEach(doc => {
        html += createDocumentCard(doc);
      });
      
      html += `</div>`;
    }
    
    container.innerHTML = html;
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-document-btn').forEach(button => {
      button.addEventListener('click', function() {
        const documentId = this.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this document?')) {
          deleteDocument(documentId);
        }
      });
    });
  }
  
  // Function to create a document card
  function createDocumentCard(doc) {
    const fileExtension = doc.path.split('.').pop().toLowerCase();
    let iconClass = 'bi-file-earmark';
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      iconClass = 'bi-file-earmark-image';
    } else if (fileExtension === 'pdf') {
      iconClass = 'bi-file-earmark-pdf';
    }
    
    // Extract document path for download link
    let downloadPath = doc.path;
    if (downloadPath.startsWith('/uploads/')) {
      downloadPath = downloadPath.substring(9);
    } else if (downloadPath.startsWith('uploads/')) {
      downloadPath = downloadPath.substring(8);
    }
    
    return `
      <div class="col-md-4 mb-3">
        <div class="card h-100">
          <div class="card-body text-center">
            <i class="bi ${iconClass} fs-1 mb-3"></i>
            <h5 class="card-title">${doc.documentType || 'Document'}</h5>
            <p class="card-text small text-muted">Uploaded: ${new Date(doc.uploadDate).toLocaleDateString()}</p>
            <div class="btn-group" role="group">
              <a href="${doc.path}" class="btn btn-sm btn-primary" target="_blank">
                <i class="bi bi-eye"></i> View
              </a>
              <a href="/user/download-document/${downloadPath}" class="btn btn-sm btn-success">
                <i class="bi bi-download"></i> Download
              </a>
              <button class="btn btn-sm btn-danger delete-document-btn" data-id="${doc._id}">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Function to delete a document
  async function deleteDocument(documentId) {
    try {
      const response = await fetch(`/user/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Document deleted successfully!');
        fetchDocuments();
      } else {
        const data = await response.json();
        alert(data.message || 'Error deleting document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('An error occurred while deleting the document. Please try again.');
    }
  }
}); 