/**
 * Inventory Management System - Frontend Logic
 * Enhanced with modern UI, animations, and responsive design
 */

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set up global error handler
  setupGlobalErrorHandler();
  
  // Initialize debug info display
  updateDebugInfo();
  setInterval(updateDebugInfo, 2000); // Update every 2 seconds
  
  // Clean up existing jQuery event handlers to prevent duplicates
  $('#productSearch').off();
  $('#addProductForm').off();
  $('#addProductBtn').off();
  $('#saveAddBtn').off();
  
  // Fix any stuck modal backdrops
  fixStuckModalBackdrops();
  
  // Add keyboard shortcut to fix stuck modals (Escape key)
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      fixStuckModalBackdrops();
    }
  });
  
  // Add double-click event to fix stuck modals
  document.addEventListener('dblclick', function(event) {
    // Only trigger if clicking on backdrop or body when modals are stuck
    if (event.target.classList.contains('modal-backdrop') || 
        (document.body.classList.contains('modal-open') && 
         !document.querySelector('.modal.show'))) {
      fixStuckModalBackdrops();
    }
  });
  
  // Start periodic check for stuck modals
  startModalHealthCheck();
  
  // Force enable all UI elements
  document.querySelectorAll('button, input, a, .table, .table-responsive, .container').forEach(element => {
    element.style.pointerEvents = 'auto';
    element.style.opacity = '1';
  });
  
  // Remove any existing modal backdrops that might be left over
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
  
  // Ensure body is scrollable and not locked
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  
  // Explicitly initialize Bootstrap components
  initializeBootstrapComponents();
  
  // Fix search bar and add button specifically
  fixSearchAndAddButton();
  
  // Setup Add Product button to show modal with modern event handling
  const fab = document.getElementById('addProductBtn');
  if (fab) {
    fab.addEventListener('click', function() {
      // Add spin class to the button
      fab.classList.add('spin');
      
      // Remove it once the animation finishes
      fab.addEventListener('animationend', function() {
        fab.classList.remove('spin');
      }, { once: true });
      
    // Reset form fields
      document.getElementById('addProductForm')?.reset();
    
    // Show modal
    const addModal = new bootstrap.Modal(document.getElementById('addProductModal'));
    addModal.show();
    
    // Focus on product name field
    setTimeout(() => {
        document.getElementById('productName')?.focus();
    }, 500);
  });
  }
  
  // Make sure the container doesn't block events
  const container = document.querySelector('.container');
  if (container) {
    container.style.pointerEvents = 'auto';
  }
  
  // Ensure the table is properly initialized
  const tableResponsive = document.querySelector('.table-responsive');
  if (tableResponsive) {
    tableResponsive.style.pointerEvents = 'auto';
  }
  
  // Setup Add Product form submission
  $('#saveAddBtn').on('click', function() {
    const productName = $('#productName').val().trim();
    const productPrice = parseFloat($('#productPrice').val());
    
    if (!productName) {
      showMessage("Please enter a product name", "error");
      return;
    }
    
    if (isNaN(productPrice) || productPrice < 0) {
      showMessage("Please enter a valid price", "error");
      return;
    }
    
    // Show loading state
    $(this).prop('disabled', true);
    $(this).html('<i class="fas fa-spinner fa-spin"></i> Adding...');
    
    // Check if Firebase is properly initialized
    if (!firebase.apps || !firebase.apps.length) {
      console.error("Firebase is not initialized");
      showMessage("Database connection error. Please reload the page and try again.", "error");
      
      // Reset button state
      $(this).prop('disabled', false);
      $(this).html('Add Product');
      return;
    }
    
    try {
      // Add to Firestore with more robust error handling
      firebase.firestore().collection('products').add({
        product: productName,
        price: productPrice,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        showMessage("Product added successfully", "success");
        
        // Hide modal
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        if (modalInstance) {
          modalInstance.hide();
        } else {
          // If modal instance not found, force hide with jQuery
          $('#addProductModal').modal('hide');
        }
        
        // Reset form
        $('#addProductForm')[0].reset();
      })
      .catch(error => {
        console.error("Error adding product:", error);
        showMessage("Failed to add product. Please try again. Error: " + error.message, "error");
      })
      .finally(() => {
        // Reset button state
        $(this).prop('disabled', false);
        $(this).html('Add Product');
      });
    } catch (error) {
      console.error("Exception during add product:", error);
      showMessage("An unexpected error occurred. Please reload the page and try again.", "error");
      
      // Reset button state
      $(this).prop('disabled', false);
      $(this).html('Add Product');
    }
  });
  
  // Setup logo popup functionality
  setupLogoPopup();
  
  // Fetch Firebase configuration from backend securely
  fetch('/get-firebase-config/')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch Firebase configuration: ' + response.status);
      }
      return response.json();
    })
    .then(firebaseConfig => {
      // Initialize Firebase with retrieved configuration
      if (firebase.apps && firebase.apps.length) {
        // If already initialized, use the existing app
        console.log("Using existing Firebase app");
        initializeApp(firebase.firestore());
      } else {
        // Otherwise, initialize a new app
        console.log("Initializing new Firebase app");
        try {
          firebase.initializeApp(firebaseConfig);
          initializeApp(firebase.firestore());
        } catch (error) {
          console.error("Error initializing Firebase app:", error);
          showMessage("Failed to initialize database connection. Please reload the page.", "error");
        }
      }
    })
    .catch(error => {
      // Handle connection errors gracefully
      console.error("Error initializing Firebase:", error);
      showMessage("Error connecting to database. Please reload and try again later.", "error");
    });
  
  // Set up window resize handler - simplified to just adjust table
  window.addEventListener('resize', function() {
        adjustTableForScreenSize();
  });
  
  // Set up modal behaviors
  setupModalBehaviors();
  
  // Add clear button functionality for search input
  const clearSearchBtn = document.getElementById('clearSearch');
  const productSearchInput = document.getElementById('productSearch');
  
  if (clearSearchBtn && productSearchInput) {
    clearSearchBtn.addEventListener('click', function() {
      productSearchInput.value = '';
      productSearchInput.dispatchEvent(new Event('input'));
      this.style.display = 'none';
    });
  }
  
  // Set up enhanced search functionality
  setupEnhancedSearch();
});

/**
 * Setup logo popup functionality
 * Shows/hides the logo popup with smooth animation
 */
function setupLogoPopup() {
  const logo = document.getElementById('appLogo');
  const popup = document.getElementById('logoPopup');
  
  if (logo && popup) {
    // Ensure popup has correct pointer-events settings
    popup.style.pointerEvents = 'none';
    
    // Find the image container and ensure it catches clicks
    const popupImage = popup.querySelector('.logo-popup-image');
    if (popupImage) {
      popupImage.style.pointerEvents = 'auto';
    }
    
    // Ensure consistent image positioning
    const logoImg = logo.querySelector('img');
    const popupImg = popup.querySelector('.logo-popup-image img');
    
    if (logoImg && popupImg) {
      popupImg.style.objectPosition = 'center';
    }
    
    logo.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Toggle popup visibility
      if (popup.classList.contains('active')) {
        // If popup is active, close it
        popup.classList.remove('active');
      } else {
        // If popup is not active, show it
        popup.classList.add('active');
      }
    });
    
    // Close popup when clicking anywhere on the overlay (but not on the image)
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        popup.classList.remove('active');
      }
    });
    
    // Also close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        popup.classList.remove('active');
      }
    });
  }
}

/**
 * Initialize the app with Firestore database
 */
function initializeApp(db) {
  if (!db) {
    console.error("Database not provided");
    showMessage("Database connection error", "error");
    return;
  }
  
  // Properly destroy any existing DataTable instance
  let dataTable;
  if ($.fn.dataTable.isDataTable('#inventoryTable')) {
    dataTable = $('#inventoryTable').DataTable();
    dataTable.destroy();
    $('#inventoryTable tbody').empty();
  }
  
  // Initialize DataTable with improved settings
  dataTable = $('#inventoryTable').DataTable({
      paging: false,
      searching: true,
      ordering: true,
    info: false,
      autoWidth: false,
    responsive: false,
    language: {
      emptyTable: "No products found",
      zeroRecords: "No matching products found",
      info: "", // Remove "Showing X to Y of Z entries"
      infoEmpty: "",
      infoFiltered: "",
      lengthMenu: "", // Remove "Show X entries" dropdown
      paginate: {
        previous: "",
        next: ""
      }
    },
    lengthChange: false, // Disable "Show X entries" dropdown
    dom: 't', // Only show the table, no pagination controls
      columnDefs: [
      { targets: 0, width: "60%", className: "text-start" },
      { targets: 1, width: "20%", className: "text-end" },
      { targets: 2, width: "20%", className: "text-center" },
      { orderable: false, targets: 2 }
    ],
      drawCallback: function() {
        attachActionListeners();
      adjustTableForScreenSize();
      
      // Ensure column widths are maintained
      this.api().columns().every(function(index) {
        const column = this;
        if (index === 0) {
          $(column.header()).css('text-align', 'left');
        } else if (index === 1) {
          $(column.header()).css('text-align', 'right');
        } else if (index === 2) {
          $(column.header()).css('text-align', 'center');
        }
      });
    }
  });
  
  // Set up column sorting
  setupColumnSorting();
  
  // Show loading state
  showSkeletonLoading(true);
  
  // Set up real-time listener for products collection
  db.collection('products')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        // Clear existing rows
        dataTable.clear();
        
        if (snapshot.empty) {
          updateEmptyState(true);
          showSkeletonLoading(false);
          return;
        }
        
        updateEmptyState(false);
        
        // Add each product to the table
        snapshot.forEach(doc => {
          const data = doc.data();
          data.id = doc.id;
          
          // Create table row with the product data
          const rowNode = dataTable.row.add([
            data.product,
            `₱${parseFloat(data.price).toFixed(2)}`,
            createActionButtons(data.id)
          ]).node();
          
          // Store product data as attributes for easy access
          $(rowNode).attr('data-id', data.id);
          $(rowNode).attr('data-product', data.product);
          $(rowNode).attr('data-price', data.price);
          
          // Add data-label attributes for responsive display
          $(rowNode).find('td:eq(0)').attr('data-label', 'Product');
          $(rowNode).find('td:eq(1)').attr('data-label', 'Price');
          $(rowNode).find('td:eq(2)').attr('data-label', 'Actions');
        });
        
        // Draw the table with the new data
        dataTable.draw();
        
        // Apply search if there's a value in the search box
        const searchTerm = $('#productSearch').val().trim();
        if (searchTerm) {
          dataTable.search(searchTerm).draw();
          highlightSearchResults(searchTerm);
        }
    
        // Hide loading state
        showSkeletonLoading(false);
    
        // Make sure action buttons are visible
        setTimeout(function() {
          $('.btn-edit, .btn-delete').css('visibility', 'visible');
        }, 100);
      },
      error => {
        console.error("Error getting products:", error);
        showMessage("Failed to load products. Please refresh the page.", "error");
        showSkeletonLoading(false);
      }
    );
}

/**
 * Create action buttons HTML for a table row
 */
function createActionButtons(id) {
  return `
    <div class="action-buttons">
      <button class="btn-edit" data-id="${id}" title="Edit Product">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn-delete" data-id="${id}" title="Delete Product">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `;
}

/**
 * Highlight search results in the table
 */
function highlightSearchResults(searchTerm) {
  if (!searchTerm) return;
  
  // Escape special regex characters
  const escapedSearchTerm = escapeRegExp(searchTerm);
  
  try {
    // Create a regex for highlighting with word boundaries when possible
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    
    // Highlight matching text in the first column (product name)
    $('#inventoryTable tbody tr:visible td:first-child').each(function() {
      const cell = $(this);
      const originalText = cell.text();
      
      // Apply highlighting by wrapping matches in a span
      const highlightedText = originalText.replace(regex, '<span class="highlight">$1</span>');
      
      // Only update if there's a change to avoid unnecessary DOM updates
      if (originalText !== highlightedText) {
        cell.html(highlightedText);
      }
    });
  } catch (error) {
    console.error("Error in highlight function:", error);
    // Continue without highlighting if there's an error
  }
}

/**
 * Clear search highlights from the table
 */
function clearSearchHighlights() {
  $('#inventoryTable tbody tr td:first-child').each(function() {
    const $cell = $(this);
    const originalText = $cell.text();
    $cell.html(originalText);
  });
}

/**
 * Escape special characters in a string for use in a RegExp
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Update visual state based on search results
 */
function updateSearchVisualState(hasResults) {
  const tableBody = document.querySelector('#inventoryTable tbody');
  
  if (!hasResults) {
    tableBody.classList.add('no-results');
  } else {
    tableBody.classList.remove('no-results');
  }
}

/**
 * Update empty state UI
 */
function updateEmptyState(isEmpty) {
  const tableBody = document.querySelector('#inventoryTable tbody');
  
  if (isEmpty) {
    tableBody.classList.add('empty');
  } else {
    tableBody.classList.remove('empty');
  }
}

/**
 * Show message (error or success)
 */
function showMessage(message, type) {
  const elementId = type === 'error' ? 'error-message' : 'success-message';
  const textId = type === 'error' ? 'error-text' : 'success-text';
  
  const element = document.getElementById(elementId);
  const textElement = document.getElementById(textId);
  
  if (!element || !textElement) {
    console.error(`Message elements not found in DOM: ${elementId}, ${textId}`);
    return;
  }
  
  textElement.textContent = message;
  element.style.display = 'block';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    element.style.display = 'none';
  }, 3000);
}

/**
 * Populate edit form with product data
 */
function populateEditForm(product) {
  if (!product || !product.id) {
    showMessage("Invalid product data", "error");
    return;
  }
  
  $('#editProductId').val(product.id);
  $('#editProductName').val(product.product);
  $('#editProductPrice').val(product.price);
  
  // Show edit modal
  const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
  editModal.show();
  
  // Focus on product name field
  setTimeout(() => {
    document.getElementById('editProductName').focus();
  }, 500);
  
  // Set up save button handler
  $('#saveEditBtn').off('click').on('click', function() {
    const productId = $('#editProductId').val();
    const productName = $('#editProductName').val().trim();
    const productPrice = parseFloat($('#editProductPrice').val());
    
    if (!productName) {
      showMessage("Please enter a product name", "error");
      return;
    }
    
    if (isNaN(productPrice) || productPrice < 0) {
      showMessage("Please enter a valid price", "error");
      return;
    }
    
    // Show loading state
    $(this).prop('disabled', true);
    $(this).html('<i class="fas fa-spinner fa-spin"></i> Saving...');
    
    // Update in Firestore
    firebase.firestore().collection('products').doc(productId).update({
      product: productName,
      price: productPrice,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      showMessage("Product updated successfully", "success");
      
      // Hide modal
      const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
      if (modalInstance) {
        modalInstance.hide();
      } else {
        // If modal instance not found, force hide with jQuery
        $('#editProductModal').modal('hide');
      }
    })
    .catch(error => {
      console.error("Error updating product:", error);
      showMessage("Failed to update product. Please try again.", "error");
    })
    .finally(() => {
      // Reset button state
      $(this).prop('disabled', false);
      $(this).html('Save Changes');
    });
  });
}

/**
 * Handle window resize events
 */
function handleWindowResize() {
  adjustTableForScreenSize();
}

/**
 * Adjust table based on screen size
 */
function adjustTableForScreenSize() {
  const table = $('#inventoryTable').DataTable();
  
  if (table) {
    try {
      // Force redraw to apply the changes
      table.columns.adjust().draw();
    } catch (error) {
      console.error("Error adjusting table columns:", error);
    }
  }
}

/**
 * Setup modal behaviors
 */
function setupModalBehaviors() {
  // Ensure modals can be closed with escape key and clicking outside
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('shown.bs.modal', function() {
      // Focus on the first input field
      const firstInput = this.querySelector('input:not([type="hidden"])');
      if (firstInput) {
        firstInput.focus();
      }
    });
    
    // Ensure proper cleanup when modal is hidden
    modal.addEventListener('hidden.bs.modal', function() {
      // Remove any leftover backdrops
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => {
        if (!document.querySelector('.modal.show')) {
          backdrop.remove();
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      });
    });
    
    // Add manual close button functionality
    const closeButtons = modal.querySelectorAll('.btn-close, [data-bs-dismiss="modal"]');
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
          modalInstance.hide();
        } else {
          // Fallback if Bootstrap instance not found
          modal.classList.remove('show');
          modal.style.display = 'none';
          modal.setAttribute('aria-hidden', 'true');
          modal.removeAttribute('aria-modal');
          modal.removeAttribute('role');
          
          // Remove backdrop
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach(backdrop => backdrop.remove());
          
          // Restore body
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      });
    });
  });
}

/**
 * Setup column sorting
 */
function setupColumnSorting() {
  const table = $('#inventoryTable').DataTable();
  
  $('#inventoryTable thead th').each(function(index) {
    if (index < 2) { // Only apply sorting to first two columns (Product and Price)
      $(this).on('click', function() {
        const currentOrder = table.order()[0];
        
        if (currentOrder && currentOrder[0] === index) {
          // Toggle between ascending and descending
          table.order([index, currentOrder[1] === 'asc' ? 'desc' : 'asc']).draw();
        } else {
          // Default to ascending order
          table.order([index, 'asc']).draw();
        }
        
        // Update sort indicators
        $('#inventoryTable thead th').removeClass('asc desc');
        $(this).addClass(table.order()[0][1]);
      });
    }
  });
}

/**
 * Show skeleton loading state
 */
function showSkeletonLoading(show) {
  const tableBody = document.querySelector('#inventoryTable tbody');
  
  if (show) {
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add skeleton rows
    for (let i = 0; i < 5; i++) {
      const skeletonRow = document.createElement('tr');
      skeletonRow.className = 'skeleton';
      
      skeletonRow.innerHTML = `
        <td><div class="skeleton-text"></div></td>
        <td><div class="skeleton-text"></div></td>
        <td><div class="skeleton-actions"></div></td>
      `;
      
      tableBody.appendChild(skeletonRow);
    }
  }
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Set up enhanced search functionality with debounce and direct table filtering
 */
function setupEnhancedSearch() {
  const searchInput = document.getElementById('productSearch');
  const clearButton = document.getElementById('clearSearch');
  
  if (!searchInput || !clearButton) {
    console.error("Search elements not found");
    return;
  }
  
  // Get the current DataTable instance
  let dataTable;
  try {
    dataTable = $('#inventoryTable').DataTable();
  } catch (error) {
    console.error("Error getting DataTable instance:", error);
    
    // Try to reinitialize DataTable if it's not properly initialized
    if ($.fn.dataTable && $.fn.DataTable) {
      try {
        // Destroy if exists
        if ($.fn.dataTable.isDataTable('#inventoryTable')) {
          $('#inventoryTable').DataTable().destroy();
        }
        
        // Reinitialize
        dataTable = $('#inventoryTable').DataTable({
          paging: false,
          searching: true,
          ordering: true,
          info: false,
          autoWidth: false,
          responsive: false,
          language: {
            emptyTable: "No products found",
            zeroRecords: "No matching products found"
          },
          lengthChange: false,
          dom: 't'
        });
      } catch (error) {
        console.error("Failed to reinitialize DataTable:", error);
        return; // Exit if we can't get a DataTable instance
      }
    } else {
      return; // Exit if DataTable plugin is not available
    }
  }
  
  // Clean up any existing event listeners to avoid duplicates
  if (searchInput._inputHandler) {
    searchInput.removeEventListener('input', searchInput._inputHandler);
  }
  
  // Override DataTable's search function to use regex matching
  $.fn.dataTable.ext.search.pop(); // Remove any previous search functions
  $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    const searchTerm = $('#productSearch').val().trim();
    if (!searchTerm) return true; // Show all rows when no search term
    
    // Get the product name from the first column
    const productName = data[0].toLowerCase();
    
    try {
      // Create a case-insensitive regex from the search term
      // Escape special regex characters in the search term
      const escapedSearchTerm = escapeRegExp(searchTerm);
      const regex = new RegExp(escapedSearchTerm, 'i');
      
      // Test if the product name matches the regex
      return regex.test(productName);
    } catch (error) {
      console.error("Regex error:", error);
      // Fallback to simple includes matching
      return productName.includes(searchTerm.toLowerCase());
    }
  });
  
  // Create a debounced search handler with a shorter delay
  const debouncedSearch = debounce(function(searchTerm) {
    // Apply search and draw the table
    dataTable.draw();
    
    // Highlight search results if there's a search term
    if (searchTerm) {
      highlightSearchResults(searchTerm);
    } else {
      clearSearchHighlights();
    }
    
    // Update visual state based on search results
    const hasResults = dataTable.page.info().recordsDisplay > 0;
    updateSearchVisualState(hasResults);
    
    // Show no results message if needed
    toggleNoResultsRow(hasResults);
  }, 100); // Reduce debounce delay for more responsive search
  
  // Handle input events with debounce
  searchInput._inputHandler = function(event) {
    const searchTerm = this.value.trim();
    
    // Show/hide clear button based on search input
    if (searchTerm) {
      clearButton.style.display = 'block';
    } else {
      clearButton.style.display = 'none';
    }
    
    // Apply debounced search
    debouncedSearch(searchTerm);
  };
  searchInput.addEventListener('input', searchInput._inputHandler);
  
  // Initial check for existing search text
  if (searchInput.value.trim()) {
    clearButton.style.display = 'block';
    // Apply initial search
    debouncedSearch(searchInput.value.trim());
  } else {
    clearButton.style.display = 'none';
  }
  
  // Handle clear button click
  clearButton.addEventListener('click', function() {
    searchInput.value = '';
    searchInput.focus();
    this.style.display = 'none';
    
    // Clear search and show all rows
    debouncedSearch('');
  });
  
  // Force the search input to be interactive
  searchInput.style.pointerEvents = 'auto';
  searchInput.style.opacity = '1';
  
  // Return instance for debugging
  return { searchInput, clearButton, dataTable };
}

/**
 * Toggle the no results row based on search results
 */
function toggleNoResultsRow(hasResults) {
  // Check if no-results row already exists
  let noResultsRow = document.getElementById('no-results-row');
  
  if (!hasResults) {
    // Create no-results row if it doesn't exist
    if (!noResultsRow) {
      const tableBody = document.querySelector('#inventoryTable tbody');
      noResultsRow = document.createElement('tr');
      noResultsRow.id = 'no-results-row';
      noResultsRow.innerHTML = '<td colspan="3" class="no-results">No products found matching your search.</td>';
      tableBody.appendChild(noResultsRow);
    }
    noResultsRow.style.display = '';
  } else if (noResultsRow) {
    noResultsRow.style.display = 'none';
  }
}

/**
 * Attach event listeners to action buttons in the table
 */
function attachActionListeners() {
  // Remove any existing document-level event handlers to prevent duplicates
  $(document).off('click.actionButtons');
  
  // Use direct event delegation for edit buttons
  $(document).on('click.actionButtons', '.btn-edit', function(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const productId = $(this).data('id');
    if (productId) {
      // Add visual feedback to the icon
      const iconElement = $(this).find('i');
      iconElement.addClass('btn-active');
      setTimeout(() => {
        iconElement.removeClass('btn-active');
      }, 300);
      
      // Handle the edit action
      handleEditAction(productId);
    }
  });
  
  // Use direct event delegation for delete buttons
  $(document).on('click.actionButtons', '.btn-delete', function(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const productId = $(this).data('id');
    if (productId) {
      // Add visual feedback to the icon
      const iconElement = $(this).find('i');
      iconElement.addClass('btn-active');
      setTimeout(() => {
        iconElement.removeClass('btn-active');
      }, 300);
      
      // Handle the delete action
      handleDeleteAction(productId);
    }
  });
}

/**
 * Handle edit action
 */
function handleEditAction(productId) {
  // Find product data from the table row
  const row = document.querySelector(`#inventoryTable tr[data-id="${productId}"]`);
  
  if (row) {
    const product = {
      id: productId,
      product: row.getAttribute('data-product'),
      price: row.getAttribute('data-price')
    };
    
    populateEditForm(product);
  }
}

/**
 * Handle delete action
 */
function handleDeleteAction(productId) {
  // Find product data from the table row
  const row = document.querySelector(`#inventoryTable tr[data-id="${productId}"]`);
  
  if (row) {
    const productName = row.getAttribute('data-product');
    
    // Set product name in confirmation modal
    document.getElementById('deleteProductName').textContent = productName;
    
    // Show delete confirmation modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteProductModal'));
    deleteModal.show();
    
    // Set up confirm delete button handler
    $('#confirmDeleteBtn').off('click').on('click', function() {
      // Show loading state
      $(this).prop('disabled', true);
      $(this).html('<i class="fas fa-spinner fa-spin"></i> Deleting...');
      
      // Delete from Firestore
      firebase.firestore().collection('products').doc(productId).delete()
        .then(() => {
          showMessage("Product deleted successfully", "success");
          
          // Hide modal
          const modalInstance = bootstrap.Modal.getInstance(document.getElementById('deleteProductModal'));
          if (modalInstance) {
            modalInstance.hide();
          } else {
            // If modal instance not found, force hide with jQuery
            $('#deleteProductModal').modal('hide');
          }
        })
        .catch(error => {
          console.error("Error deleting product:", error);
          showMessage("Failed to delete product. Please try again.", "error");
        })
        .finally(() => {
          // Reset button state
          $(this).prop('disabled', false);
          $(this).html('Delete');
        });
    });
  }
}

/**
 * Fix any stuck modal backdrops that might be preventing interaction
 */
function fixStuckModalBackdrops() {
  console.log("Running UI fix...");
  
  // Remove any existing modal-backdrop elements
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => {
    backdrop.remove();
  });
  
  // Remove modal-open class from body to ensure scrolling works
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  
  // Make sure all modals are closed and reset
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    modal.removeAttribute('role');
  });
  
  // Force enable all interactive elements
  const interactiveElements = document.querySelectorAll('button, input, a, .table, .table-responsive, .container');
  interactiveElements.forEach(element => {
    element.style.pointerEvents = 'auto';
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.display = element.tagName.toLowerCase() === 'button' || element.tagName.toLowerCase() === 'input' ? 'inline-block' : '';
    element.style.userSelect = 'auto';
    element.style.webkitUserSelect = 'auto';
  });
  
  console.log("Fixed potential UI issues");
}

/**
 * Fix search bar and add button functionality specifically
 */
function fixSearchAndAddButton() {
  // Fix search bar
  const searchInput = document.getElementById('productSearch');
  if (searchInput) {
    // Remove and recreate the search input to clear any event issues
    const searchWrapper = searchInput.parentNode;
    const originalValue = searchInput.value;
    const newSearchInput = searchInput.cloneNode(true);
    newSearchInput.value = originalValue;
    
    // Replace the input
    searchWrapper.replaceChild(newSearchInput, searchInput);
    
    // Also ensure the clear button is fixed
    const clearButton = document.getElementById('clearSearch');
    if (clearButton) {
      // Make sure the clear button works properly
      clearButton.addEventListener('click', function() {
        newSearchInput.value = '';
        newSearchInput.focus();
        this.style.display = 'none';
        
        // Apply empty search to DataTable directly
        if ($.fn.dataTable.isDataTable('#inventoryTable')) {
          $('#inventoryTable').DataTable().search('').draw();
        }
      });
    }
    
    // Reattach event listeners with a slight delay to ensure DOM is ready
    setTimeout(() => {
      setupEnhancedSearch();
      
      // Force focus on the input to ensure it's ready for typing
      newSearchInput.focus();
      setTimeout(() => newSearchInput.blur(), 100); // Blur after to avoid keyboard popup on mobile
    }, 100);
  }
  
  // Fix add button
  const addButton = document.getElementById('addProductBtn');
  if (addButton) {
    // Remove and recreate the button to clear any event issues
    const parentNode = addButton.parentNode;
    const newAddButton = addButton.cloneNode(true);
    parentNode.replaceChild(newAddButton, addButton);
    
    // Reattach event listener
    newAddButton.addEventListener('click', function() {
      // Add spin class to the button
      newAddButton.classList.add('spin');
      
      // Remove it once the animation finishes
      newAddButton.addEventListener('animationend', function() {
        newAddButton.classList.remove('spin');
      }, { once: true });
      
      // Reset form fields
      document.getElementById('addProductForm')?.reset();
      
      // Show modal
      const addModal = new bootstrap.Modal(document.getElementById('addProductModal'));
      addModal.show();
      
      // Focus on product name field
      setTimeout(() => {
        document.getElementById('productName')?.focus();
      }, 500);
    });
  }
}

/**
 * Initialize all Bootstrap components explicitly
 */
function initializeBootstrapComponents() {
  // Initialize all tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Initialize all popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
  
  // Initialize all modals
  document.querySelectorAll('.modal').forEach(modalElement => {
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (!modalInstance) {
      new bootstrap.Modal(modalElement);
    }
  });
}

/**
 * Setup global error handler to catch and recover from JavaScript errors
 */
function setupGlobalErrorHandler() {
  window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    
    // Show error message
    showMessage("Caught an error. Attempting to recover UI...", "error");
    
    // Try to fix UI
    setTimeout(fixStuckModalBackdrops, 500);
    
    // Return false to allow default error handling as well
    return false;
  });
  
  // Also handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Show error message
    showMessage("Caught an async error. Attempting to recover UI...", "error");
    
    // Try to fix UI
    setTimeout(fixStuckModalBackdrops, 500);
  });
}

/**
 * Start periodic health check for stuck modals
 */
function startModalHealthCheck() {
  // Check every 5 seconds for stuck modals
  setInterval(() => {
    // Check if there are any visible modals
    const visibleModals = document.querySelectorAll('.modal.show');
    
    // If no visible modals but backdrop exists or body is modal-open
    if (visibleModals.length === 0 && 
        (document.querySelectorAll('.modal-backdrop').length > 0 || 
         document.body.classList.contains('modal-open'))) {
      
      // Show the fix button
      const fixButton = document.getElementById('fixUIButton');
      if (fixButton) {
        fixButton.style.display = 'block';
      }
      
      console.log("Detected stuck modal state, showing fix button");
    }
  }, 5000);
}

/**
 * Update the debug info display
 */
function updateDebugInfo() {
  const debugInfo = document.getElementById('debugInfo');
  if (!debugInfo) return;
  
  // Count DOM elements
  const totalElements = document.querySelectorAll('*').length;
  const fixedElements = document.querySelectorAll('*[style*="position: fixed"], *[style*="position:fixed"]').length;
  const backdrops = document.querySelectorAll('.modal-backdrop').length;
  
  // Check body state
  const bodyClasses = document.body.className;
  const bodyStyles = window.getComputedStyle(document.body);
  
  // Check for pointer events
  const containerStyle = window.getComputedStyle(document.querySelector('.container') || {});
  const tableStyle = window.getComputedStyle(document.querySelector('.table-responsive') || {});
  const searchStyle = window.getComputedStyle(document.querySelector('.search-wrapper') || {});
  
  debugInfo.innerHTML = `
    <strong>UI Debug Info</strong><br>
    DOM Elements: ${totalElements}<br>
    Fixed Elements: ${fixedElements}<br>
    Modal Backdrops: ${backdrops}<br>
    Body Classes: ${bodyClasses || 'none'}<br>
    Body overflow: ${bodyStyles.overflow}<br>
    Container pointer-events: ${containerStyle.pointerEvents}<br>
    Table pointer-events: ${tableStyle.pointerEvents}<br>
    Search pointer-events: ${searchStyle.pointerEvents}<br>
    <button onclick="toggleDebugInfo()" class="btn btn-sm btn-secondary mt-2">Hide Debug</button>
  `;
}

/**
 * Toggle debug info visibility
 */
function toggleDebugInfo() {
  const debugInfo = document.getElementById('debugInfo');
  if (debugInfo) {
    if (debugInfo.style.display === 'none') {
      debugInfo.style.display = 'block';
      debugInfo.innerHTML = 'Loading debug info...';
      updateDebugInfo();
    } else {
      debugInfo.style.display = 'none';
    }
  }
}