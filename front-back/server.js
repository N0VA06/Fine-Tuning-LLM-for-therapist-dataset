const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://192.168.112.1:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', async (msg, callback) => {
        try {
            const response = await axios.post('http://192.168.112.1:1235/v1/chat/completions', {
                model: "lmstudio-community/Therapist-2.0/thera.Q4_K_M.gguf",
                messages: [
                    {
                        role: "system",
                        content: "As a therapist, your primary role is to provide empathetic and supportive responses that foster a safe space. Your role is to ask the user how they are feeling, if they want to discuss more on this topic, and ask questions like that."
                    },
                    {
                        role: "user",
                        content: msg
                    }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "response",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                response: {
                                    type: "string"
                                }
                            },
                            required: ["response"]
                        }
                    }
                },
                temperature: 0.7,
                max_tokens: 150,
                stream: false
            });

            callback({ message: response.data.response });
        } catch (error) {
            console.error('Error:', error);
            callback({ error: 'An error occurred while processing your message.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});