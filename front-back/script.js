const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg ${role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'} max-w-3/4`;
    messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'Therapist'}:</strong> ${content}`;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function getTherapistResponse(userMessage) {
    const url = "http://192.168.112.1:1235/v1/chat/completions";
    const payload = {
        "model": "lmstudio-community/Therapist-2.0/thera.Q4_K_M.gguf",
        "messages": [
            {
                "role": "system",
                "content": "As a therapist, your primary role is to provide empathetic and supportive responses that foster a safe space. Your role is to ask the user how they are feeling, if they want to discuss more on this topic, and ask questions like that."
            },
            {
                "role": "user",
                "content": userMessage
            }
        ],
        "temperature": 0.7,
        "max_tokens": 150
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
        console.log('API Response:', data);  

        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Unexpected response structure');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function handleSendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addMessage('user', message);
        userInput.value = '';

        try {
            const therapistResponse = await getTherapistResponse(message);
            addMessage('therapist', therapistResponse);
        } catch (error) {
            console.error('Error getting therapist response:', error);
            addMessage('system', 'Sorry, there was an error processing your message. Please try again.');
        }
    }
}

sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// Initial greeting
addMessage('therapist', "Hello! How are you feeling today? I'm here to listen and support you.");