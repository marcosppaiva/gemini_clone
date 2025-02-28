// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const menuToggle = document.getElementById('menuToggle');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    
    // State variables
    let isMobile = window.innerWidth <= 980;
    
    // Initialize sidebar state based on screen size
    function initializeSidebar() {
        if (isMobile) {
            sidebar.classList.add('collapsed');
            mainContent.classList.remove('with-sidebar');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.add('with-sidebar');
        }
    }
    
    // Toggle sidebar visibility
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('with-sidebar');
        
        if (sidebarToggle) {
            sidebarToggle.classList.toggle('rotated');
        }
        
        // Update menu toggle icon based on sidebar state
        if (menuToggle) {
            if (sidebar.classList.contains('collapsed')) {
                menuToggle.querySelector('i').className = 'bx bx-menu';
            } else {
                menuToggle.querySelector('i').className = 'bx bx-x';
            }
        }
        
        // On mobile, show/hide backdrop
        if (isMobile && !sidebar.classList.contains('collapsed')) {
            sidebarBackdrop.classList.add('active');
        } else {
            sidebarBackdrop.classList.remove('active');
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Sidebar toggle button (inside sidebar)
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function(e) {
                e.preventDefault();
                toggleSidebar();
            });
        }
        
        // Menu toggle button (in navbar) - now works in both directions
        if (menuToggle) {
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                toggleSidebar();
            });
        }
        
        // Backdrop click to close sidebar on mobile
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', function() {
                sidebar.classList.add('collapsed');
                mainContent.classList.remove('with-sidebar');
                sidebarBackdrop.classList.remove('active');
                if (sidebarToggle) {
                    sidebarToggle.classList.add('rotated');
                }
                // Reset menu toggle icon
                if (menuToggle) {
                    menuToggle.querySelector('i').className = 'bx bx-menu';
                }
            });
        }
        
        // Handle window resize
        window.addEventListener('resize', function() {
            const wasMobile = isMobile;
            isMobile = window.innerWidth <= 980;
            
            // Only reinitialize if we crossed the mobile threshold
            if (wasMobile !== isMobile) {
                initializeSidebar();
                // Reset menu toggle icon based on sidebar state
                if (menuToggle) {
                    menuToggle.querySelector('i').className = sidebar.classList.contains('collapsed') ? 
                        'bx bx-menu' : 'bx bx-x';
                }
            }
        });
    }
    
    // For dynamically adding chat history items
    function addChatToHistory(chatTitle, isActive = false) {
        const historyContainer = document.querySelector('.sidebar__history');
        const chatItem = document.createElement('div');
        chatItem.className = `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`;
        
        chatItem.innerHTML = `
            <i class='bx bx-message-rounded'></i>
            <span>${chatTitle}</span>
        `;
        
        chatItem.addEventListener('click', function() {
            // Remove active class from all items
            document.querySelectorAll('.sidebar__item').forEach(item => {
                item.classList.remove('sidebar__item--active');
            });
            
            // Add active class to clicked item
            chatItem.classList.add('sidebar__item--active');
            
            // Load the selected conversation
            console.log(`Loading conversation: ${chatTitle}`);
            
            // On mobile, close the sidebar after selection
            if (isMobile) {
                toggleSidebar();
            }
        });
        
        historyContainer.appendChild(chatItem);
    }
    
    // New chat button functionality
    function setupNewChatButton() {
        const newChatButton = document.querySelector('.sidebar__new-chat');
        if (newChatButton) {
            newChatButton.addEventListener('click', function() {
                // Clear current chat and start new one
                console.log('Starting new conversation');
                
                // Example: clear chat area
                const chatArea = document.querySelector('.chats');
                if (chatArea) {
                    chatArea.innerHTML = '';
                }
                
                // Example: reset header visibility if it was hidden
                const header = document.querySelector('.header');
                if (header) {
                    header.classList.remove('hide');
                    document.body.classList.remove('hide-header');
                }
                
                // Update active item in sidebar
                document.querySelectorAll('.sidebar__item').forEach(item => {
                    item.classList.remove('sidebar__item--active');
                });
                
                // On mobile, close the sidebar after action
                if (isMobile) {
                    toggleSidebar();
                }
            });
        }
    }
    
    // Initialize everything
    initializeSidebar();
    setupEventListeners();
    setupNewChatButton();
    
    // Set initial menu toggle icon based on sidebar state
    if (menuToggle) {
        menuToggle.querySelector('i').className = sidebar.classList.contains('collapsed') ? 
            'bx bx-menu' : 'bx bx-x';
    }
});