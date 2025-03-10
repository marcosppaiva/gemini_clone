const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");
const messageForm = document.querySelector(".prompt__form");
const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");
const header = document.querySelector(".header");

// State variables
let currentUserMessage = null;
let isGeneratingResponse = false;

// If the window.currentConversationId is set from the server, use it
if (typeof window.currentConversationId !== 'undefined') {
    currentConversationId = window.currentConversationId;
} else {
    currentConversationId = getConversationIdFromUrl();
}

// Scroll to bottom of chat function
const scrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight);
};

// Create a new chat message element
const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
}

// Show typing effect
const showTypingEffect = (rawText, htmlText, messageElement, incomingMessageElement, skipEffect = false) => {
    const copyIconElement = incomingMessageElement.querySelector(".message__icon");
    if (copyIconElement) {
        copyIconElement.classList.add("hide"); // Initially hide copy button
    }

    if (skipEffect) {
        // Display content directly without typing
        messageElement.innerHTML = htmlText;
        hljs.highlightAll();
        addCopyButtonToCodeBlocks();
        if (copyIconElement) {
            copyIconElement.classList.remove("hide"); // Show copy button
        }
        isGeneratingResponse = false;
        scrollToBottom(); // Scroll to bottom after content is displayed
        return;
    }

    const wordsArray = rawText.split(' ');
    let wordIndex = 0;

    const typingInterval = setInterval(() => {
        messageElement.innerText += (wordIndex === 0 ? '' : ' ') + wordsArray[wordIndex++];
        scrollToBottom(); // Scroll while typing is happening
        
        if (wordIndex === wordsArray.length) {
            clearInterval(typingInterval);
            isGeneratingResponse = false;
            messageElement.innerHTML = htmlText;
            hljs.highlightAll();
            addCopyButtonToCodeBlocks();
            if (copyIconElement) {
                copyIconElement.classList.remove("hide");
            }
            scrollToBottom(); // Scroll after formatting
        }
    }, 75);
};

// Add copy button to code blocks
const addCopyButtonToCodeBlocks = () => {
    const codeBlocks = document.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
        // Skip if already has a copy button
        if (block.querySelector('.code__copy-btn')) return;
        
        const codeElement = block.querySelector('code');
        if (!codeElement) return;
        
        let language = [...codeElement.classList].find(cls => cls.startsWith('language-'))?.replace('language-', '') || 'Text';

        const languageLabel = document.createElement('div');
        languageLabel.innerText = language.charAt(0).toUpperCase() + language.slice(1);
        languageLabel.classList.add('code__language-label');
        block.appendChild(languageLabel);

        const copyButton = document.createElement('button');
        copyButton.innerHTML = `<i class='bx bx-copy'></i>`;
        copyButton.classList.add('code__copy-btn');
        block.appendChild(copyButton);

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(codeElement.innerText).then(() => {
                copyButton.innerHTML = `<i class='bx bx-check'></i>`;
                setTimeout(() => copyButton.innerHTML = `<i class='bx bx-copy'></i>`, 2000);
            }).catch(err => {
                console.error("Copy failed:", err);
                alert("Unable to copy text!");
            });
        });
    });
    
    scrollToBottom(); // Scroll after adding code block elements
};

// Copy message to clipboard
window.copyMessageToClipboard = (copyButton) => {
    const messageContent = copyButton.parentElement.querySelector(".message__text").innerText;

    navigator.clipboard.writeText(messageContent);
    copyButton.innerHTML = `<i class='bx bx-check'></i>`; // Confirmation icon
    setTimeout(() => copyButton.innerHTML = `<i class='bx bx-copy-alt'></i>`, 1000); // Revert icon after 1 second
};

// Function to set the current conversation
function setCurrentConversation(conversationId) {
    currentConversationId = conversationId;
    
    // Add the conversation ID to the URL without reloading the page
    if (conversationId) {
        const url = new URL(window.location);
        url.searchParams.set('conversation_id', conversationId);
        window.history.pushState({}, '', url);
    }
}

// Function to extract conversation ID from URL
function getConversationIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('conversation_id');
}

// Function to update the sidebar to highlight the active conversation
function updateSidebarActiveConversation(conversationId) {
    const sidebarItems = document.querySelectorAll('.sidebar__item');
    
    sidebarItems.forEach(item => {
        if (item.dataset.conversationId === conversationId) {
            item.classList.add('sidebar__item--active');
        } else {
            item.classList.remove('sidebar__item--active');
        }
    });
}

// Function to load a specific conversation (via page navigation)
function loadConversation(conversationId) {
    window.location.href = `/?conversation_id=${conversationId}`;
}

// Function to send message and handle conversation tracking
function sendMessage(message) {
    // Create the response message with loading state
    const incomingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="/static/assets/gemini.svg" alt="Gemini avatar">
            <p class="message__text"></p>
            <div class="message__loading-indicator">
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
            </div>
        </div>
        <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
    `;
    
    const loadingMessageElement = createChatMessageElement(incomingMessageHtml, "message--incoming", "message--loading");
    chatHistoryContainer.appendChild(loadingMessageElement);
    
    scrollToBottom();
    
    // Create FormData for the request
    const formData = new FormData();
    formData.append("question", message);
    
    // Add conversation ID if available
    if (currentConversationId) {
        formData.append("conversation_id", currentConversationId);
    }
    
    // Add selected model
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
        formData.append("model", modelSelector.value);
    }
    
    // Get CSRF token
    const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;
    
    // Send request
    fetch(window.location.href, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken,
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json(); // Parse JSON response if content type is JSON
        } else {
            return response.text().then(text => {
                return { text: text }; // Return as object with text property for compatibility
            });
        }
    })
    .then(responseData => {
        if (!responseData || typeof responseData.text === 'undefined') {
            throw new Error("Invalid response received.");
        }
        
        // Update the conversation ID if provided in the response
        if (responseData.conversation_id) {
            setCurrentConversation(responseData.conversation_id);
            
            // If this is a new conversation, refresh the page to show updated sidebar
            if (!currentConversationId) {
                window.location.href = `/?conversation_id=${responseData.conversation_id}`;
                return;
            }
            
            // Update sidebar to highlight the current conversation
            updateSidebarActiveConversation(responseData.conversation_id);
        }
        
        const parsedApiResponse = marked.parse(responseData.text);
        const rawApiResponse = responseData.text;
        
        const messageTextElement = loadingMessageElement.querySelector(".message__text");
        const loadingIndicator = loadingMessageElement.querySelector(".message__loading-indicator");
        
        if (loadingIndicator) {
            loadingIndicator.classList.add("hide");
        }
        
        showTypingEffect(rawApiResponse, parsedApiResponse, messageTextElement, loadingMessageElement);
    })
    .catch(error => {
        isGeneratingResponse = false;
        const messageTextElement = loadingMessageElement.querySelector(".message__text");
        messageTextElement.innerText = `Error: ${error.message}`;
        loadingMessageElement.classList.add("message--error");
        
        const loadingIndicator = loadingMessageElement.querySelector(".message__loading-indicator");
        if (loadingIndicator) {
            loadingIndicator.classList.add("hide");
        }
        
        scrollToBottom();
    })
    .finally(() => {
        loadingMessageElement.classList.remove("message--loading");
    });
}

// Handle sending chat messages
function handleOutgoingMessage() {
    currentUserMessage = messageForm.querySelector(".prompt__form-input").value.trim();
    if (!currentUserMessage || isGeneratingResponse) return; // Exit if no message or already generating response

    isGeneratingResponse = true;

    const outgoingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="/static/assets/profile.png" alt="User avatar">
            <p class="message__text"></p>
        </div>
    `;

    const outgoingMessageElement = createChatMessageElement(outgoingMessageHtml, "message--outgoing");
    outgoingMessageElement.querySelector(".message__text").innerText = currentUserMessage;
    chatHistoryContainer.appendChild(outgoingMessageElement);

    messageForm.reset(); // Clear input field
    
    // Hide the header if visible
    if (header) {
        header.style.display = 'none';
        document.body.classList.add("hide-header");
    }
    
    scrollToBottom(); // Scroll after sending message
    setTimeout(() => {
        sendMessage(currentUserMessage);
    }, 500);
}

// Add code syntax highlighting to any existing code blocks
function highlightCodeBlocks() {
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });
    addCopyButtonToCodeBlocks();
}

// Observe content changes to scroll when new content is added
const observeContentChanges = () => {
    // Create a MutationObserver to watch for content changes
    const observer = new MutationObserver((mutations) => {
        // If content has changed significantly, scroll to bottom
        for (const mutation of mutations) {
            if (mutation.type === 'childList' || 
                (mutation.type === 'characterData' && 
                 mutation.target.textContent.length > mutation.oldValue?.length + 20)) {
                scrollToBottom();
                break;
            }
        }
    });
    
    // Start observing the chat container
    observer.observe(chatHistoryContainer, { 
        childList: true,      // Watch for added/removed elements
        subtree: true,        // Watch all descendants
        characterData: true,  // Watch for text changes
        characterDataOldValue: true // Need old value to compare text length
    });
};

// Connect sidebar conversation items to load correct conversations
function initializeConversationItems() {
    const sidebarItems = document.querySelectorAll('.sidebar__item');
    
    sidebarItems.forEach(item => {
        const conversationId = item.dataset.conversationId;
        if (!conversationId) return;
        
        // Remove any existing click listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add click event to load the conversation
        newItem.addEventListener('click', () => {
            loadConversation(conversationId);
        });
    });
}

// EVENT LISTENERS

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set smooth scrolling behavior
    if (chatHistoryContainer) {
        chatHistoryContainer.style.scrollBehavior = 'smooth';
    }
    
    // Initialize content observer
    observeContentChanges();
    
    // Add syntax highlighting to existing code blocks
    highlightCodeBlocks();
    
    // Initialize conversation items in sidebar
    initializeConversationItems();
    
    // Add resize listener to handle scrolling when window size changes
    window.addEventListener('resize', scrollToBottom);
    
    // Scroll to bottom on initial load
    scrollToBottom();
});

// Toggle between light and dark themes
themeToggleButton.addEventListener('click', () => {
    const isLightTheme = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");

    // Update icon based on theme
    const newIconClass = isLightTheme ? "bx bx-moon" : "bx bx-sun";
    themeToggleButton.querySelector("i").className = newIconClass;
});

// Clear all chat history button - redirect to index now
clearChatButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear this conversation?")) {
        // If we're in a conversation, redirect to home
        window.location.href = '/';
    }
});

// Handle click on suggestion items
suggestionItems.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        const suggestionText = suggestion.querySelector(".suggests__item-text").innerText;
        messageForm.querySelector(".prompt__form-input").value = suggestionText;
        handleOutgoingMessage();
    });
});

// Prevent default form submission and handle outgoing message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

// Model selector functionality
document.addEventListener('DOMContentLoaded', function() {
    const modelSelector = document.getElementById('modelSelector');
    
    if (modelSelector) {
        // Load previously selected model from localStorage if available
        const savedModel = localStorage.getItem('selectedModel');
        if (savedModel) {
            modelSelector.value = savedModel;
        }
        
        // Handle model selection change
        modelSelector.addEventListener('change', function() {
            const selectedModel = modelSelector.value;
            
            // Save selection to localStorage
            localStorage.setItem('selectedModel', selectedModel);
            
            // Show notification of model change
            const notification = document.createElement('div');
            notification.className = 'model-notification';
            notification.textContent = `Switched to ${selectedModel}`;
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 3000);
        });
    }
});

// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Show confirmation dialog
            if (confirm('Are you sure you want to log out?')) {
                // Redirect to logout page
                window.location.href = '/logout/';
            }
        });
    }
});

// Helper function to get CSRF token from cookies (for Django)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Apply theme from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
    document.body.classList.toggle("light_mode", isLightTheme);
    
    if (themeToggleButton) {
        themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';
    }
})