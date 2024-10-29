
const toggleTheme = document.getElementById('toggle-theme');
const html = document.documentElement;
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

toggleTheme.addEventListener('click', () => {
    html.classList.toggle('dark');
});

// API configurations
const rapidAPIKey = '';
const rapidAPIHost = '';
const apiUrl = '';

// Text-to-speech function
function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
}

// Function to add messages to the chat window
function addMessage(role, content, skipSpeech = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg ${role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'} max-w-3/4 mb-2`;
    messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'Therapist'}:</strong> ${content}`;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    if (role === 'therapist' && !skipSpeech) {
        speakText(content);
    }
}
// Function to get therapist response
async function getTherapistResponse(userMessage) {
    const highestEmotion = Object.keys(emotionData).reduce((a, b) => 
        (emotionData[a][emotionData[a].length - 1] || 0) > (emotionData[b][emotionData[b].length - 1] || 0) ? a : b
    );

    const payload = {
        messages: [
            {
                role: "system",
                content: `As a therapist,Suggest users what they should do according to their current emotion. Your role is to listen with empathy and ensure the user feels safe and understood. Based on the user's emotional state, their predominant emotion is "${highestEmotion}". Adjust your response to focus on this emotion.
                

            - If the emotion is 'angry,' acknowledge their frustration, ask what caused the anger, and guide them toward calming down.
            - If it's 'disgust,' be gentle and inquire if there's something specific bothering them that they want to share.
            - If 'fear' is prominent, reassure them, and help them explore the root of their anxieties in a safe way.
            - If they're feeling 'happy,' celebrate this moment and encourage them to reflect on what brings them joy.
            - For 'sadness,' express empathy and encourage them to share what’s on their mind, while offering reassurance.
            - If they feel 'surprised,' ask what unexpected event occurred and whether it was positive or negative.
            - If 'neutral,' prompt them with open-ended questions to explore their state further, helping them articulate their emotions.
            Always maintain a supportive and positive tone to create a safe space where the user feels heard and understood.
            Adjust your language and approach based on the user's age, gender, and occupation. Be empathetic and supportive in your responses.`
            },
            {
                role: "user",
                content: userMessage
            }
        ],
        web_access: false
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': rapidAPIHost,
                'x-rapidapi-key': rapidAPIKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data.result) {
            return data.result;
        } else {
            throw new Error('Unexpected response structure');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Function to handle sending messages
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

// Event listeners for message sending
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// Initial greeting - with skipSpeech set to true
addMessage('therapist', "Hello! How are you feeling today? I'm here to listen and support you.", true);
let chart;
let isDetecting = false;
const maxDataPoints = 30; // Number of data points to show in the line graph

// Initialize arrays for each emotion's time series data
const emotionData = {
    'angry': [],
    'disgust': [],
    'fear': [],
    'happy': [],
    'sad': [],
    'surprise': [],
    'neutral': []
};

// Initialize the line chart
function initChart() {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(maxDataPoints).fill(''),
            datasets: [
                {
                    label: 'Happy',
                    data: Array(maxDataPoints).fill(null),
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Sad',
                    data: Array(maxDataPoints).fill(null),
                    borderColor: 'rgb(153, 102, 255)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Angry',
                    data: Array(maxDataPoints).fill(null),
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Neutral',
                    data: Array(maxDataPoints).fill(null),
                    borderColor: 'rgb(201, 203, 207)',
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 6
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Confidence (%)'
                    }
                },
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

// Update the line chart with new emotion data
function updateChart(emotions) {
    // Update data for each emotion
    Object.entries(emotions).forEach(([emotion, value]) => {
        if (!emotionData[emotion]) {
            emotionData[emotion] = [];
        }
        
        emotionData[emotion].push(value);
        if (emotionData[emotion].length > maxDataPoints) {
            emotionData[emotion].shift();
        }
    });

    // Update chart datasets
    chart.data.datasets.forEach(dataset => {
        const emotion = dataset.label.toLowerCase();
        if (emotionData[emotion]) {
            dataset.data = emotionData[emotion];
        }
    });

    // Update labels to show relative time points
    chart.data.labels = Array(maxDataPoints).fill('').map((_, i) => 
        `-${(maxDataPoints - 1 - i) * 0.5}s`
    );

    chart.update('none'); // Update without animation for better performance
}

async function processFrame() {
    if (!isDetecting) return;

    const videoElement = document.getElementById('videoFeed');
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    
    try {
        const response = await fetch('http://localhost:5000/process-frame', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                frame: canvas.toDataURL('image/jpeg')
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Update current emotion and confidence
            document.getElementById('currentEmotion').textContent = 
                data.dominant_emotion.charAt(0).toUpperCase() + 
                data.dominant_emotion.slice(1);
            document.getElementById('confidence').textContent = 
                `${(data.confidence * 100).toFixed(1)}%`;

            // Update emotion counts display
            Object.entries(data.emotions).forEach(([emotion, value]) => {
                const elementId = `${emotion.toLowerCase()}-count`;
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = `${value.toFixed(1)}%`;
                }
            });

            // Update line chart
            updateChart(data.emotions);
        }
    } catch (error) {
        console.error('Error:', error);
    }

    if (isDetecting) {
        requestAnimationFrame(processFrame);
    }
}

async function startDetection() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.getElementById('videoFeed');
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        await videoElement.play();
        
        isDetecting = true;
        document.getElementById('statusIndicator').classList.add('active');
        document.getElementById('statusText').textContent = 'Detection Active';
        document.getElementById('emotionToggleBtn').textContent = 'Stop Detection';
        
        processFrame();
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Failed to access camera. Please ensure camera permissions are granted.');
    }
}

function stopDetection() {
    isDetecting = false;
    const videoElement = document.getElementById('videoFeed');
    const stream = videoElement.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    videoElement.style.display = 'none';
    videoElement.srcObject = null;
    
    document.getElementById('statusIndicator').classList.remove('active');
    document.getElementById('statusText').textContent = 'Detection Inactive';
    document.getElementById('emotionToggleBtn').textContent = 'Start Detection';
}

// Event Listeners
document.getElementById('emotionToggleBtn').addEventListener('click', () => {
    if (isDetecting) {
        stopDetection();
    } else {
        startDetection();
    }
});
toggleTheme.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-theme');
    const button = document.getElementById('toggle-theme');
    button.textContent = document.documentElement.classList.contains('dark-theme') 
        ? 'Light Mode' 
        : 'Dark Mode';
});

// Initialize on page load
window.onload = function() {
    initChart();
};
