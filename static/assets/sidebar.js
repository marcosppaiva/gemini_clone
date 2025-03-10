// Simplified sidebar functionality
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
        
        // Menu toggle button (in navbar)
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
                if (menuToggle) {
                    menuToggle.querySelector('i').className = sidebar.classList.contains('collapsed') ? 
                        'bx bx-menu' : 'bx bx-x';
                }
            }
        });
    }
    
    // Initialize everything
    initializeSidebar();
    setupEventListeners();
    
    // Set initial menu toggle icon based on sidebar state
    if (menuToggle) {
        menuToggle.querySelector('i').className = sidebar.classList.contains('collapsed') ? 
            'bx bx-menu' : 'bx bx-x';
    }
});