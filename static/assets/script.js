const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");
const messageForm = document.querySelector(".prompt__form");
const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

// State variables
let currentUserMessage = null;
let isGeneratingResponse = false;

// Scroll to bottom of chat function
const scrollToBottom = () => {
    // chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);

};

// Load saved data from local storage
const loadSavedChatHistory = () => {
    const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

    document.body.classList.toggle("light_mode", isLightTheme);
    themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';

    chatHistoryContainer.innerHTML = '';

    // Iterate through saved chat history and display messages
    savedConversations.forEach(conversation => {
        // Display the user's message
        const userMessageHtml = `
            <div class="message__content">
                <img class="message__avatar" src="/static/assets/profile.png" alt="User avatar">
               <p class="message__text">${conversation.userMessage}</p>
            </div>
        `;

        const outgoingMessageElement = createChatMessageElement(userMessageHtml, "message--outgoing");
        chatHistoryContainer.appendChild(outgoingMessageElement);

        // Display the API response
        const responseText = conversation.apiResponse;
        const parsedApiResponse = marked.parse(responseText); // Convert to HTML
        const rawApiResponse = responseText; // Plain text version

        const responseHtml = `
           <div class="message__content">
                <img class="message__avatar" src="/static/assets/gemini.svg" alt="Gemini avatar">
                <p class="message__text"></p>
                <div class="message__loading-indicator hide">
                    <div class="message__loading-bar"></div>
                    <div class="message__loading-bar"></div>
                    <div class="message__loading-bar"></div>
                </div>
            </div>
            <span onClick="copyMessageToClipboard(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
        `;

        const incomingMessageElement = createChatMessageElement(responseHtml, "message--incoming");
        chatHistoryContainer.appendChild(incomingMessageElement);

        const messageTextElement = incomingMessageElement.querySelector(".message__text");

        // Display saved chat without typing effect
        showTypingEffect(rawApiResponse, parsedApiResponse, messageTextElement, incomingMessageElement, true); // 'true' skips typing
    });

    document.body.classList.toggle("hide-header", savedConversations.length > 0);
    scrollToBottom();
};

// create a new chat message element
const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
}

// Show typing effect
const showTypingEffect = (rawText, htmlText, messageElement, incomingMessageElement, skipEffect = false) => {
    const copyIconElement = incomingMessageElement.querySelector(".message__icon");
    copyIconElement.classList.add("hide"); // Initially hide copy button

    if (skipEffect) {
        // Display content directly without typing
        messageElement.innerHTML = htmlText;
        hljs.highlightAll();
        addCopyButtonToCodeBlocks();
        copyIconElement.classList.remove("hide"); // Show copy button
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
            copyIconElement.classList.remove("hide");
            scrollToBottom(); // Scroll after formatting
        }
    }, 75);
};

// Fetch API response based on user input from Django backend
const requestApiResponse = async (incomingMessageElement) => {
    const messageTextElement = incomingMessageElement.querySelector(".message__text");
    const loadingIndicator = incomingMessageElement.querySelector(".message__loading-indicator");
    
    // Show loading indicator
    if (loadingIndicator) {
        loadingIndicator.classList.remove("hide");
    }

    try {
        // Get CSRF token from the form
        const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;
        
        // Create form data for Django POST request
        const formData = new FormData();
        formData.append("question", currentUserMessage);

        const response = await fetch(window.location.href, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const responseText = await response.text();
        if (!responseText) throw new Error("Empty response received.");

        const parsedApiResponse = marked.parse(responseText);
        const rawApiResponse = responseText;

        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.classList.add("hide");
        }

        showTypingEffect(rawApiResponse, parsedApiResponse, messageTextElement, incomingMessageElement);

        // Save conversation in local storage
        let savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
        savedConversations.push({
            userMessage: currentUserMessage,
            apiResponse: responseText
        });
        localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
    } catch (error) {
        isGeneratingResponse = false;
        messageTextElement.innerText = `Error: ${error.message}`;
        messageTextElement.closest(".message").classList.add("message--error");
        
        // Hide loading indicator on error
        if (loadingIndicator) {
            loadingIndicator.classList.add("hide");
        }
        
        scrollToBottom(); // Scroll to show error message
    } finally {
        incomingMessageElement.classList.remove("message--loading");
    }
};

// Add copy button to code blocks
const addCopyButtonToCodeBlocks = () => {
    const codeBlocks = document.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
        const codeElement = block.querySelector('code');
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

// Show loading animation during API request
const displayLoadingAnimation = () => {
    const loadingHtml = `
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

    const loadingMessageElement = createChatMessageElement(loadingHtml, "message--incoming", "message--loading");
    chatHistoryContainer.appendChild(loadingMessageElement);
    
    scrollToBottom(); // Scroll to see the loading animation
    requestApiResponse(loadingMessageElement);
};

// Copy message to clipboard
window.copyMessageToClipboard = (copyButton) => {
    const messageContent = copyButton.parentElement.querySelector(".message__text").innerText;

    navigator.clipboard.writeText(messageContent);
    copyButton.innerHTML = `<i class='bx bx-check'></i>`; // Confirmation icon
    setTimeout(() => copyButton.innerHTML = `<i class='bx bx-copy-alt'></i>`, 1000); // Revert icon after 1 second
};

// Handle sending chat messages
const handleOutgoingMessage = () => {
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
    document.body.classList.add("hide-header");
    
    scrollToBottom(); // Scroll after sending message
    setTimeout(displayLoadingAnimation, 500); // Show loading animation after delay
};

// Toggle between light and dark themes
themeToggleButton.addEventListener('click', () => {
    const isLightTheme = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");

    // Update icon based on theme
    const newIconClass = isLightTheme ? "bx bx-moon" : "bx bx-sun";
    themeToggleButton.querySelector("i").className = newIconClass;
});

// Clear all chat history
clearChatButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all chat history?")) {
        localStorage.removeItem("saved-api-chats");

        // Reload chat history to reflect changes
        loadSavedChatHistory();

        currentUserMessage = null;
        isGeneratingResponse = false;
        
        // Show header again when chat history is cleared
        document.body.classList.remove("hide-header");
    }
});

// Handle click on suggestion items
suggestionItems.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        const suggestionText = suggestion.querySelector(".suggests__item-text").innerText;
        messageForm.querySelector(".prompt__form-input").value = suggestionText;
        currentUserMessage = suggestionText;
        handleOutgoingMessage();
    });
});

// Prevent default form submission and handle outgoing message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set smooth scrolling behavior
    chatHistoryContainer.style.scrollBehavior = 'smooth';
    
    // Initialize content observer
    observeContentChanges();
    
    // Load saved chat history
    loadSavedChatHistory();
    
    // Add resize listener to handle scrolling when window size changes
    window.addEventListener('resize', scrollToBottom);
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
            
            // You can add code here to change the active model
            console.log(`Model changed to: ${selectedModel}`);
            
            // Optional: Show a notification or loading indicator
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

// Model selection
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
            
            // You can add code here to change the active model
            console.log(`Model changed to: ${selectedModel}`);
            
            // Optional: Show a notification or loading indicator
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