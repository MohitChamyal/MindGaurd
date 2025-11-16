const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const { SpeechClient } = require('@google-cloud/speech');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const HealthReport = require('../models/HealthReport');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Initialize clients with error handling
let ttsClient, sttClient, genAI;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    ttsClient = new TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    sttClient = new SpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  } else {
    console.warn('Google Cloud credentials not configured. Voice features will use fallback mode.');
    ttsClient = null;
    sttClient = null;
  }
  
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } else {
    console.warn('Gemini API key not configured.');
    genAI = null;
  }
} catch (error) {
  console.error('Error initializing voice clients:', error);
  ttsClient = null;
  sttClient = null;
  genAI = null;
}

// Store active conversations
const conversations = new Map();

// Default questions if none provided
const defaultQuestions = [
  "How would you describe your overall mood today on a scale from 1 to 10?",
  "Are you experiencing any anxiety? Would you describe it as none, mild, moderate, or severe?",
  "How would you rate your sleep quality last night on a scale from 1 to 10?",
  "On a scale from 1 to 10, how would you rate your energy levels today?",
  "Are you experiencing any physical symptoms like headaches, tension, or stomach issues?",
  "On a scale from 1 to 10, how would you rate your ability to concentrate today?",
  "Have you engaged in any self-care activities today?",
  "On a scale from 1 to 10, how socially connected do you feel today?",
  "Are you experiencing any intrusive or recurring thoughts today?",
  "On a scale from 1 to 10, how optimistic do you feel about the future?"
];

class VoiceAgent {
  constructor() {
    this.conversations = new Map();
  }

  /**
   * Start a new conversation session
   * @param {string} userId - User ID
   * @param {Array} questions - List of questions to ask
   * @returns {Object} - Session ID and current question
   */
  startConversation(userId, questions = defaultQuestions) {
    const sessionId = uuidv4();
    this.conversations.set(sessionId, {
      userId,
      questions,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now()
    });

    return {
      sessionId,
      currentQuestion: {
        question: questions[0],
        questionNumber: 1,
        totalQuestions: questions.length
      }
    };
  }

  /**
   * Get the current question to ask
   * @param {string} sessionId - Session ID
   * @returns {Object} - Question object with text and metadata
   */
  getCurrentQuestion(sessionId) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return null;

    const { questions, currentQuestionIndex } = conversation;
    if (currentQuestionIndex >= questions.length) return null;

    return {
      question: questions[currentQuestionIndex],
      questionNumber: currentQuestionIndex + 1,
      totalQuestions: questions.length
    };
  }

  /**
   * Process a user response and determine next action
   * @param {string} sessionId - Session ID
   * @param {string} response - User's response text
   * @returns {Object} - Result with next action
   */
  async processResponse(sessionId, response) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.answers.push({
      question: conversation.questions[conversation.currentQuestionIndex],
      response,
      timestamp: Date.now()
    });

    conversation.currentQuestionIndex++;

    if (conversation.currentQuestionIndex >= conversation.questions.length) {
      return {
        status: 'completed',
        summary: {
          answers: conversation.answers,
          duration: Date.now() - conversation.startTime
        }
      };
    }

    return {
      status: 'in_progress',
      question: this.getCurrentQuestion(sessionId)
    };
  }

  /**
   * Check for timed out conversations and handle no responses
   * @param {string} sessionId - Session ID
   * @returns {Object} - Action to take
   */
  checkResponseTimeout(sessionId) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) throw new Error('Conversation not found');

    const timeoutThreshold = 15000; // 15 seconds
    const timeSinceLastInteraction = Date.now() - conversation.lastInteractionTime;

    if (timeSinceLastInteraction > timeoutThreshold) {
      const currentQuestion = this.getCurrentQuestion(sessionId);
      return {
        status: 'repeat',
        message: "I haven't heard your response. Would you like me to repeat the question?",
        question: currentQuestion
      };
    }

    return { status: 'active' };
  }

  /**
   * Convert text to speech using Google TTS
   * @param {string} text - Text to convert to speech
   * @returns {Buffer} - Audio buffer or null if not available
   */
  async textToSpeech(text) {
    try {
      // Return null if TTS is not configured (will use browser TTS)
      if (!ttsClient) {
        console.log('TTS not configured, using browser speech synthesis');
        return null;
      }

      const request = {
        input: { text },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      };

      const [response] = await ttsClient.synthesizeSpeech(request);
      return response.audioContent;
    } catch (error) {
      console.error('Text-to-speech error:', error);
      // Return null on error to fallback to browser TTS
      return null;
    }
  }

  /**
   * Store conversation results and trigger Python pipeline
   * @param {string} sessionId - Session ID
   */
  async storeConversationResults(sessionId) {
    try {
      const conversation = this.conversations.get(sessionId);
      if (!conversation) return;

      // Convert voice responses to the format expected by the Python pipeline
      const formattedResponses = {
        user_id: conversation.userId,
        responses: {
          mood: this.extractNumericResponse(conversation.answers[0]?.processedResponse), // Mood question
          anxiety: this.extractAnxietyLevel(conversation.answers[1]?.processedResponse), // Anxiety question
          sleep_quality: this.extractNumericResponse(conversation.answers[2]?.processedResponse), // Sleep quality
          energy_levels: this.extractNumericResponse(conversation.answers[3]?.processedResponse), // Energy levels
          physical_symptoms: conversation.answers[4]?.processedResponse || "", // Physical symptoms
          concentration: this.extractNumericResponse(conversation.answers[5]?.processedResponse), // Concentration
          self_care: this.extractSelfCareLevel(conversation.answers[6]?.processedResponse), // Self-care
          social_interactions: this.extractNumericResponse(conversation.answers[7]?.processedResponse), // Social connection
          intrusive_thoughts: conversation.answers[8]?.processedResponse || "", // Intrusive thoughts
          optimism: this.extractNumericResponse(conversation.answers[9]?.processedResponse), // Optimism
          stress_factors: conversation.answers[10]?.processedResponse || "" // Stress factors
        },
        timestamp: new Date().toISOString()
      };

      // Save to MongoDB first
      const healthReport = new HealthReport({
        userId: conversation.userId,
        questionnaireData: formattedResponses.responses,
        voiceAssessment: true,
        timestamp: formattedResponses.timestamp
      });

      await healthReport.save();

      // Write responses to a temporary JSON file for Python processing
      const tempFilePath = path.join(__dirname, '..', 'agent', 'user_data', `${conversation.userId}_voice_responses.json`);
      await fs.promises.writeFile(tempFilePath, JSON.stringify(formattedResponses));

      // Trigger Python emotion report generator
      await this.generateEmotionReport(conversation.userId, tempFilePath);

      // Clean up the session after processing
      setTimeout(() => {
        this.conversations.delete(sessionId);
        // Clean up temp file
        fs.promises.unlink(tempFilePath).catch(console.error);
      }, 300000); // Clean up after 5 minutes

    } catch (error) {
      console.error('Error storing conversation results:', error);
      throw error;
    }
  }

  /**
   * Helper method to extract numeric responses
   * @param {string} response - Processed response text
   * @returns {number} - Extracted number or null
   */
  extractNumericResponse(response) {
    if (!response) return null;
    const numbers = response.match(/\d+/);
    if (numbers) {
      const num = parseInt(numbers[0]);
      return Math.min(10, Math.max(1, num));
    }
    return null;
  }

  /**
   * Helper method to extract anxiety level
   * @param {string} response - Processed response text
   * @returns {string} - Anxiety level
   */
  extractAnxietyLevel(response) {
    if (!response) return "none";
    const text = response.toLowerCase();
    if (text.includes('severe')) return "severe";
    if (text.includes('moderate')) return "moderate";
    if (text.includes('mild')) return "mild";
    return "none";
  }

  /**
   * Helper method to extract self-care level
   * @param {string} response - Processed response text
   * @returns {string} - Self-care level
   */
  extractSelfCareLevel(response) {
    if (!response) return "none";
    const text = response.toLowerCase();
    if (text.includes('extensive')) return "extensive";
    if (text.includes('moderate')) return "moderate";
    if (text.includes('minimal')) return "minimal";
    return "none";
  }

  /**
   * Trigger Python emotion report generation
   * @param {string} userId - User ID
   * @param {string} responsesPath - Path to responses JSON file
   */
  async generateEmotionReport(userId, responsesPath) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '..', 'agent', 'emotion_report_generator.py');
      const pythonProcess = spawn('python', [
        pythonScript,
        '--user_id', userId,
        '--responses_file', responsesPath
      ]);

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python process error:', errorData);
          reject(new Error(`Emotion report generation failed with code ${code}`));
        } else {
          console.log('Emotion report generated successfully');
          resolve(outputData);
        }
      });
    });
  }

  /**
   * Get conversation status
   * @param {string} sessionId - Session ID
   * @returns {Object} - Conversation status
   */
  getConversationStatus(sessionId) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return { status: 'not_found' };

    return {
      status: conversation.currentQuestionIndex >= conversation.questions.length ? 'completed' : 'in_progress',
      progress: {
        current: conversation.currentQuestionIndex,
        total: conversation.questions.length
      }
    };
  }

  async generateSummary(sessionId) {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) throw new Error('Conversation not found');

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Analyze these mental health assessment responses:
      ${JSON.stringify(conversation.answers)}
      
      Generate a summary that includes:
      1. Overall emotional state
      2. Key concerns identified
      3. Recommended follow-up actions
      4. Risk assessment (low/moderate/high)
      
      Format as JSON with these keys:
      {
        "emotionalState": string,
        "keyConcerns": string[],
        "recommendations": string[],
        "riskLevel": string,
        "followUpNeeded": boolean
      }
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}

module.exports = new VoiceAgent();