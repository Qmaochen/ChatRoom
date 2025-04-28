const express = require('express');
const { HfInference } = require('@huggingface/inference');
const dotenv = require('dotenv');
const path = require('path');

// 加載環境變量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 檢查 API 密鑰
if (!process.env.HUGGINGFACE_API_KEY) {
    console.error('Error: HUGGINGFACE_API_KEY is not set in .env file');
    process.exit(1);
}

// 初始化 Hugging Face
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

app.use(express.json());
app.use(express.static('public'));

// 處理聊天請求
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('Received message:', message);
        
        // 使用 DialoGPT-medium 模型生成回應
        const response = await hf.textGeneration({
            model: 'microsoft/DialoGPT-medium',
            inputs: message,
            parameters: {
                max_length: 100,
                temperature: 0.7,
                top_p: 0.9,
                repetition_penalty: 1.0
            }
        });

        if (!response || !response.generated_text) {
            throw new Error('No response generated from the model');
        }

        console.log('Bot response:', response.generated_text);
        res.json({ response: response.generated_text });
    } catch (error) {
        console.error('Error generating response:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            details: error.message 
        });
    }
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 