document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to access this page');
    window.location.href = 'login.html';
    return;
  }

  // Set welcome message
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'User';
  document.getElementById('welcomeMessage').textContent = `Welcome, ${userName}`;

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

  // Fetch user data
  fetchUserData();
  fetchApplications();
  fetchFinancialData();
  fetchRepayments();
  fetchDocuments();

  // Handle navigation clicks
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      // Remove active class from all links
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      // Add active class to clicked link
      this.classList.add('active');

      // Hide all sections
      document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
      });

      // Show selected section
      const targetId = this.getAttribute('href').substring(1);
      document.getElementById(targetId).style.display = 'block';
    });
  });

  // Functions to fetch data
  async function fetchUserData() {
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const response = await fetch(`/user/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update profile information if needed
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  async function fetchApplications() {
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const response = await fetch(`/loan/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const applications = await response.json();
        
        // Update dashboard stats
        document.getElementById('applicationCount').textContent = applications.length;
        
        let totalBorrowed = 0;
        let remainingBalance = 0;
        
        applications.forEach(app => {
          if (app.status === 'Approved') {
            totalBorrowed += app.amount;
            remainingBalance += app.remainingBalance || app.amount;
          }
        });
        
        document.getElementById('totalBorrowed').textContent = `£${totalBorrowed}`;
        document.getElementById('remainingBalance').textContent = `£${remainingBalance}`;
        
        // Display applications in table
        const applicationsTableBody = document.getElementById('applicationsTableBody');
        
        if (applications.length === 0) {
          applicationsTableBody.innerHTML = `
            <tr>
              <td colspan="7" class="text-center">No applications found. <a href="loan-application.html">Apply for a loan</a>.</td>
            </tr>
          `;
          return;
        }
        
        applicationsTableBody.innerHTML = '';
        
        applications.forEach(app => {
        const row = document.createElement('tr');
          const statusClass = getStatusClass(app.status);
          
        row.innerHTML = `
            <td>${app._id}</td>
            <td>${app.organization || app.institution}</td>
            <td>${app.course}</td>
            <td>£${app.amount}</td>
            <td><span class="badge ${statusClass}">${app.status}</span></td>
            <td>${new Date(app.createdAt).toLocaleDateString()}</td>
            <td>
              <a href="loan-status.html?id=${app._id}" class="btn btn-sm btn-info">
                <i class="bi bi-eye"></i> View
              </a>
            </td>
          `;
          
          applicationsTableBody.appendChild(row);
        });

        // Get the most recent application
        const mostRecentApp = applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        // Update the View Loan Status button to include this loan's ID
        const viewLoanStatusBtn = document.querySelector('a[href="loan-status.html"]');
        if (viewLoanStatusBtn) {
          viewLoanStatusBtn.href = `loan-status.html?id=${mostRecentApp._id}`;
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }

  function getStatusClass(status) {
    switch(status) {
      case 'Approved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      case 'Pending': return 'bg-warning text-dark';
      case 'Pending Review': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  async function fetchFinancialData() {
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const response = await fetch(`/financial/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const financialDataContainer = document.getElementById('financialDataContainer');
        
        if (!data.financialData) {
          financialDataContainer.innerHTML = `
            <p class="text-center">No financial information found. <a href="financial-data.html">Submit your financial information</a>.</p>
          `;
          return;
        }
        
        const financialData = data.financialData;
        
        financialDataContainer.innerHTML = `
          <div class="row">
            <div class="col-md-6">
              <p><strong>Annual Income:</strong> £${financialData.annualIncome}</p>
              <p><strong>Family Income:</strong> £${financialData.familyIncome}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Outstanding Debts:</strong> £${financialData.outstandingDebts || 0}</p>
              <p><strong>Assets:</strong> £${financialData.assets || 0}</p>
            </div>
          </div>
          <p><strong>Submission Date:</strong> ${new Date(financialData.submissionDate).toLocaleDateString()}</p>
          <p><strong>Additional Notes:</strong> ${financialData.additionalNotes || 'None'}</p>
          <div class="mt-3">
            <a href="financial-data.html" class="btn btn-primary">
              <i class="bi bi-pencil"></i> Update Financial Information
            </a>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  }

  async function fetchRepayments() {
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const response = await fetch(`/loan/repayments/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const repayments = await response.json();
        const repaymentsContainer = document.getElementById('repaymentsContainer');
        
        if (repayments.length === 0) {
          repaymentsContainer.innerHTML = `
            <p class="text-center">No repayments found. You will see your repayment schedule here once your loan is approved.</p>
          `;
          return;
        }
        
        let repaymentsHtml = `
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Institution</th>
                  <th>Original Amount</th>
                  <th>Remaining Balance</th>
                  <th>Next Payment Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        repayments.forEach(repayment => {
          repaymentsHtml += `
            <tr>
              <td>${repayment._id}</td>
              <td>${repayment.organization || repayment.institution}</td>
              <td>£${repayment.amount}</td>
              <td>£${repayment.remainingBalance}</td>
              <td>${repayment.nextPaymentDue ? new Date(repayment.nextPaymentDue).toLocaleDateString() : 'N/A'}</td>
              <td>
                <a href="loan-status.html?id=${repayment._id}" class="btn btn-sm btn-info">
                  <i class="bi bi-eye"></i> View
                </a>
                <a href="make-payment.html?id=${repayment._id}" class="btn btn-sm btn-success">
                  <i class="bi bi-cash"></i> Make Payment
                </a>
              </td>
            </tr>
          `;
        });
        
        repaymentsHtml += `
              </tbody>
            </table>
          </div>
        `;
        
        repaymentsContainer.innerHTML = repaymentsHtml;
      }
      } catch (error) {
      console.error('Error fetching repayments:', error);
    }
  }

  async function fetchDocuments() {
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const response = await fetch(`/user/documents/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const documents = await response.json();
        const documentsContainer = document.getElementById('documentsContainer');
        
        if (documents.length === 0) {
          documentsContainer.innerHTML = `
            <p class="text-center">No documents found. <a href="upload-documents.html">Upload identification and financial documents</a>.</p>
          `;
          return;
        }
        
        let documentsHtml = `
          <div class="row">
        `;
        
        documents.forEach((doc, index) => {
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
          
          documentsHtml += `
            <div class="col-md-4 mb-3">
              <div class="card h-100">
                <div class="card-body text-center">
                  <i class="bi ${iconClass} fs-1 mb-3"></i>
                  <h5 class="card-title">${doc.documentType || `Document ${index + 1}`}</h5>
                  <p class="card-text small text-muted">${doc.category || 'Unknown type'}</p>
                  <div class="btn-group">
                    <a href="${doc.path}" class="btn btn-primary btn-sm" target="_blank">
                      <i class="bi bi-eye"></i> View
                    </a>
                    <a href="/user/download-document/${downloadPath}" class="btn btn-success btn-sm">
                      <i class="bi bi-download"></i> Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        
        documentsHtml += `
          </div>
          <div class="mt-3">
            <a href="upload-documents.html" class="btn btn-primary">
              <i class="bi bi-upload"></i> Upload More Documents
            </a>
          </div>
        `;
        
        documentsContainer.innerHTML = documentsHtml;
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  // Update dashboard to show document status
  async function checkDocumentStatus() {
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const response = await fetch(`/user/document-status/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const status = await response.json();
      
      // Update the Apply for Loan button based on document status
      const applyLoanBtn = document.querySelector('a[href="loan-application.html"]');
      if (applyLoanBtn) {
        if (!status.canApplyForLoan) {
          applyLoanBtn.classList.add('disabled');
          applyLoanBtn.setAttribute('data-bs-toggle', 'tooltip');
          applyLoanBtn.setAttribute('data-bs-placement', 'top');
          applyLoanBtn.setAttribute('title', 'You must upload identification and financial documents before applying for a loan');
          
          // Create a tooltip for the button
          new bootstrap.Tooltip(applyLoanBtn);
          
          // Add a notification about missing documents
          const quickActionsCard = applyLoanBtn.closest('.card');
          if (quickActionsCard) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning mt-3';
            alertDiv.innerHTML = `
              <p><strong>Document requirements:</strong> You need to upload the following documents before applying for a loan:</p>
              <ul class="mb-0">
                ${!status.hasIdentityDocuments ? '<li>Identification documents</li>' : ''}
                ${!status.hasFinancialDocuments ? '<li>Financial documents</li>' : ''}
              </ul>
              <div class="mt-2">
                <a href="upload-documents.html" class="btn btn-sm btn-warning">Upload Documents</a>
              </div>
            `;
            quickActionsCard.querySelector('.card-body').appendChild(alertDiv);
          }
        } else {
          applyLoanBtn.classList.remove('disabled');
        }
      }
    } catch (error) {
      console.error('Error checking document status:', error);
    }
  }

  // Call this function after fetching applications
  checkDocumentStatus();
});
  