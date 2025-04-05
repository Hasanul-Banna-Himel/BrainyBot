document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const chatHistory = document.getElementById('chatHistory');
    const userPrompt = document.getElementById('userPrompt');
    const submitBtn = document.getElementById('submitBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const clearChatBtn = document.getElementById('clearChatBtn'); // Get clear button

    // Backend API URL 
    const API_URL = 'http://localhost:5000/ask';

    
    const initialAssistantMessageContent = "Hello! How can I help you today?"; // Example content
    const hasInitialGreeting = true; 

    // Function to add a message to the chat history
    function addMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'assistant-message');

        if (isUser) {
            messageDiv.textContent = content; // User messages as plain text (Safer)
        } else {
            
            if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
                
                try {
                    
                    // DOMPurify.setConfig({ USE_PROFILES: { html: true } });
                    messageDiv.innerHTML = DOMPurify.sanitize(marked.parse(content));
                } catch (parseError) {
                    console.error("Error parsing Markdown or sanitizing HTML:", parseError);
                    messageDiv.textContent = content; // Fallback to plain text if parsing/sanitizing fails
                }
            } else {
                console.warn("marked.js or DOMPurify not loaded. Displaying assistant message as plain text.");
                messageDiv.textContent = content; // Fallback if libraries aren't loaded
            }
        }

        chatHistory.appendChild(messageDiv);
        // Scroll to the bottom of the chat history
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Function to handle form submission
    async function handleSubmit() {
        const prompt = userPrompt.value.trim();

        if (!prompt) return; // Don't send empty messages

        // Add user message to chat
        addMessage(prompt, true);

        // Clear input field and show loading indicator
        userPrompt.value = '';
        loadingIndicator.style.display = 'block';
        submitBtn.disabled = true; // Disable button while waiting
        userPrompt.disabled = true; // Disable input while waiting


        try {
            // Send request to backend
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Add any other headers if required (e.g., Authorization)
                },
                body: JSON.stringify({ prompt }) // Send prompt in the expected format
            });

            // --- Added Check: Handle HTTP errors (e.g., 404, 500) ---
            if (!response.ok) {
                // Try to get error message from response body if possible, otherwise use status text
                let errorMsg = `HTTP error! Status: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorData.message || errorMsg; // Use backend error if available
                } catch (e) {
                    // Ignore if response body is not JSON or empty
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();

            // Check the structure of the backend response
            if (data && typeof data.response !== 'undefined') { // Assuming backend sends { response: "..." } on success
                // Add assistant response to chat
                addMessage(data.response, false);
            } else if (data && typeof data.error !== 'undefined') { // Assuming backend sends { error: "..." } on failure
                 addMessage('Sorry, I encountered an error: ' + data.error, false);
            }
             else {
                 // Handle unexpected response format
                 console.error("Unexpected response format:", data);
                 addMessage('Sorry, I received an unexpected response from the server.', false);
            }

        } catch (error) {
            // Handle network errors or errors thrown above
            console.error('Error during fetch:', error);
            addMessage(`Sorry, I couldn't get a response. ${error.message || 'Please try again later.'}`, false);
        } finally {
            // Hide loading indicator and re-enable input/button
            loadingIndicator.style.display = 'none';
            submitBtn.disabled = false;
            userPrompt.disabled = false;
            userPrompt.focus(); // Set focus back to the input field
        }
    }

    // --- Revised Clear Chat Functionality ---
    function clearChat() {
        // Remove all message elements from the chat history
        chatHistory.innerHTML = '';

        // Optionally, add the initial greeting back
        if (hasInitialGreeting && initialAssistantMessageContent) {
            addMessage(initialAssistantMessageContent, false);
        }

        userPrompt.focus(); // Focus input after clearing
    }


    // --- Event Listeners ---
    submitBtn.addEventListener('click', handleSubmit);

    userPrompt.addEventListener('keydown', function(event) {
        // Submit on Enter key press, but allow Shift+Enter for new lines
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default Enter behavior (newline)
            handleSubmit();
        }
    });

    clearChatBtn.addEventListener('click', clearChat);

    // --- Initial Setup ---
    
     if (hasInitialGreeting && initialAssistantMessageContent) {
        // Check if the initial message element already exists from HTML
        // This prevents adding it again if it's hardcoded in index.html
        if (!chatHistory.querySelector('.assistant-message')) {
             addMessage(initialAssistantMessageContent, false);
        }
    }
    userPrompt.focus(); // Focus the input field on page load

});