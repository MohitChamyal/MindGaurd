const express = require('express');
const router = express.Router();
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const { SpeechClient } = require('@google-cloud/speech');
const { WebSocketServer } = require('ws');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const voiceAgent = require('../services/voiceAgent');

// Initialize Google Cloud clients with error handling
let ttsClient, sttClient, genAI;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    ttsClient = new TextToSpeechClient();
    sttClient = new SpeechClient();
  } else {
    console.warn('Google Cloud credentials not configured. Using fallback mode.');
    ttsClient = null;
    sttClient = null;
  }
  
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.error('Error initializing voice clients:', error);
  ttsClient = null;
  sttClient = null;
}

// Default questionnaire questions
const defaultQuestions = [
  "How would you describe your overall mood today on a scale from 1 to 10?",
  "Are you experiencing any anxiety? Would you describe it as none, mild, moderate, or severe?",
  "How would you rate your sleep quality last night on a scale from 1 to 10?",
  "On a scale from 1 to 10, how would you rate your energy levels today?",
  "Are you experiencing any physical symptoms like headaches, tension, or stomach issues?",
  "On a scale from 1 to 10, how would you rate your ability to concentrate today?",
  "Have you engaged in any self-care activities today? Would you describe it as none, minimal, moderate, or extensive?",
  "On a scale from 1 to 10, how socially connected do you feel today?",
  "Are you experiencing any intrusive or recurring thoughts today?",
  "On a scale from 1 to 10, how optimistic do you feel about the future?",
  "Is there anything specific causing you stress right now?"
];

// TTS endpoint
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;

    // Check if TTS is available
    if (!ttsClient) {
      return res.status(503).json({ 
        error: 'Text-to-speech service not configured',
        message: 'Please use browser speech synthesis',
        fallback: true
      });
    }

    const request = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ 
      error: 'Failed to convert text to speech',
      fallback: true
    });
  }
});

// Initialize STT session
router.post('/stt/start', async (req, res) => {
  try {
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      model: 'default',
      enableAutomaticPunctuation: true,
    };

    const request = {
      config,
      interimResults: true,
    };

    // Store config in session for WebSocket
    req.session.sttConfig = config;
    res.json({ status: 'ready' });
  } catch (error) {
    console.error('STT initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize speech recognition' });
  }
});

// Enhance response using Gemini
router.post('/enhance-response', async (req, res) => {
  try {
    const { text, question } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Given the mental health assessment question: "${question}"
    And the user's response: "${text}"
    Please analyze and enhance this response to:
    1. Extract key emotional indicators
    2. Identify potential concerns
    3. Maintain the core meaning while making it more structured
    4. Format it in a clear, professional manner
    Provide the enhanced response in a single paragraph.`;

    const result = await model.generateContent(prompt);
    const enhanced_text = result.response.text();

    res.json({ enhanced_text });
  } catch (error) {
    console.error('Response enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance response' });
  }
});

// === Voice Agent Conversation Endpoints ===

// Start a new conversation
router.post('/conversation/start', auth, async (req, res) => {
  try {
    console.log('User from auth middleware:', req.user); // Debug log
    const userId = req.user.id;
    
    if (!userId) {
      console.error('No user ID in request');
      return res.status(401).json({ 
        error: 'Invalid user ID',
        details: 'User ID not found in token'
      });
    }

    const { questions } = req.body;

    // Start the conversation
    const conversation = voiceAgent.startConversation(userId, questions);
    
    if (!conversation) {
      throw new Error('Failed to start conversation');
    }

    // Get audio for the first question (may be null if TTS not configured)
    const audioContent = await voiceAgent.textToSpeech(conversation.currentQuestion.question);
    
    res.json({
      ...conversation,
      audioContentBase64: audioContent ? audioContent.toString('base64') : null,
      useBrowserTTS: !audioContent // Signal to frontend to use browser TTS
    });
  } catch (error) {
    console.error('Error starting voice conversation:', error);
    res.status(500).json({ 
      error: 'Failed to start voice conversation',
      details: error.message 
    });
  }
});

// Get current question (with audio)
router.get('/conversation/:sessionId/question', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const currentQuestion = voiceAgent.getCurrentQuestion(sessionId);

    if (!currentQuestion) {
      return res.status(404).json({ error: 'Question not found or conversation completed' });
    }

    // Get audio for the question (may be null if TTS not configured)
    const audioContent = await voiceAgent.textToSpeech(currentQuestion.question);
    
    res.json({
      currentQuestion,
      audioContentBase64: audioContent ? audioContent.toString('base64') : null,
      useBrowserTTS: !audioContent
    });
  } catch (error) {
    console.error('Error getting current question:', error);
    res.status(500).json({ error: 'Failed to get current question' });
  }
});

// Submit response and get next question
router.post('/conversation/:sessionId/response', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { response } = req.body;
    
    const result = await voiceAgent.processResponse(sessionId, response);

    if (result.status === 'completed') {
      return res.json({
        status: 'completed',
        message: 'Thank you for completing the questionnaire',
      });
    }

    let audioContent = null;
    let responseMessage = result.message || '';

    // Get audio for the next question or repeat
    if (result.question) {
      // Add a pause between message and question if there is a message
      const textToSpeak = responseMessage 
        ? `${responseMessage}. ${result.question.question}`
        : result.question.question;
        
      audioContent = await voiceAgent.textToSpeech(textToSpeak);
    } else {
      // Just speak the message (e.g., for completion)
      audioContent = await voiceAgent.textToSpeech(responseMessage);
    }

    res.json({
      status: result.status,
      message: result.message,
      question: result.question,
      audioContentBase64: audioContent ? audioContent.toString('base64') : null,
      useBrowserTTS: !audioContent
    });
  } catch (error) {
    console.error('Error processing response:', error);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

// Check for timeouts/no response
router.get('/conversation/:sessionId/check-timeout', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = voiceAgent.checkResponseTimeout(sessionId);

    if (['repeat', 'skipped'].includes(result.status)) {
      // Generate audio for the repeat message and question
      const textToSpeak = `${result.message}. ${result.question.question}`;
      const audioContent = await voiceAgent.textToSpeech(textToSpeak);
      
      return res.json({
        ...result,
        audioContentBase64: audioContent.toString('base64')
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error checking timeout:', error);
    res.status(500).json({ error: 'Failed to check conversation timeout' });
  }
});

// Get conversation status
router.get('/conversation/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const status = voiceAgent.getConversationStatus(sessionId);
    res.json(status);
  } catch (error) {
    console.error('Error getting conversation status:', error);
    res.status(500).json({ error: 'Failed to get conversation status' });
  }
});

// Setup WebSocket server for STT streaming
function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/stt/stream' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    let recognizeStream = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'start') {
          // Create recognition stream
          recognizeStream = sttClient
            .streamingRecognize(data.config)
            .on('error', (error) => {
              console.error('STT stream error:', error);
              ws.send(JSON.stringify({ error: 'Speech recognition error' }));
            })
            .on('data', (data) => {
              const transcript = data.results[0].alternatives[0].transcript;
              const isFinal = data.results[0].isFinal;

              ws.send(JSON.stringify({
                transcript,
                isFinal
              }));
            });
        } else if (data.type === 'audio') {
          // Send audio data to recognition stream
          if (recognizeStream) {
            recognizeStream.write(data.audio);
          }
        } else if (data.type === 'stop') {
          if (recognizeStream) {
            recognizeStream.end();
          }
        }
      } catch (error) {
        console.error('WebSocket message handling error:', error);
        ws.send(JSON.stringify({ error: 'Failed to process audio' }));
      }
    });

    ws.on('close', () => {
      if (recognizeStream) {
        recognizeStream.end();
      }
    });
  });
}

module.exports = { router, setupWebSocket };