document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const chatHistory = document.getElementById('chatHistory');
    const userPrompt = document.getElementById('userPrompt');
    const submitBtn = document.getElementById('submitBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Backend API URL (adjust as needed)
    const API_URL = 'http://localhost:5000/ask';
    
    // Function to add a message to the chat history
    function addMessage(message, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'assistant-message');
        messageDiv.textContent = message;
        chatHistory.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat history
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // Function to handle form submission
    async function handleSubmit() {
        const prompt = userPrompt.value.trim();
        
        if (!prompt) return;
        
        // Add user message to chat
        addMessage(prompt, true);
        
        // Clear input and show loading indicator
        userPrompt.value = '';
        loadingIndicator.style.display = 'block';
        
        try {
            // Send request to backend
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Add assistant response to chat
                addMessage(data.response, false);
            } else {
                // Handle error
                addMessage('Sorry, I encountered an error: ' + data.error, false);
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, I couldn\'t connect to the server. Please try again later.', false);
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Event listeners
    submitBtn.addEventListener('click', handleSubmit);
    
    userPrompt.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    });
});