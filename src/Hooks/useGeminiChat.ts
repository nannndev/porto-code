
import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, PortfolioData, LogLevel } from '../App/types';
import { getContextualPrompt } from '../Utils/aiUtils'; 
import { playSound } from '../Utils/audioUtils';
import { callGemini, isGeminiAvailable } from '../Utils/geminiClient';

export const TYPING_ANIMATION_ID_PREFIX = "ai-typing-"; 

export const useGeminiChat = (
  portfolioData: PortfolioData,
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void
) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedMessages = localStorage.getItem('portfolio-chatMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        return parsedMessages.map((msg: ChatMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error("Failed to load chat messages from localStorage:", error);
      addAppLog('error', "Failed to load chat messages from localStorage.", 'AIChatHook', { error });
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('portfolio-chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    isGeminiAvailable().then(keyExists => {
      if (cancelled) return;
      setApiKeyAvailable(keyExists);
      addAppLog('debug', `Gemini API Available: ${keyExists}`, 'AIChatHook');

      if (messages.length === 0) { 
          if (keyExists) {
              const initialMessageText = "Hello there! 👋 I'm Nandang's friendly AI Portfolio Assistant. I can help you learn about his skills, projects, and experience. Feel free to ask me anything, or try one of the quick prompts below!";
              setMessages([
                  {
                  id: `${TYPING_ANIMATION_ID_PREFIX}${crypto.randomUUID()}`,
                  text: initialMessageText,
                  sender: 'ai',
                  timestamp: new Date(),
                  recommendedFiles: ['about.json', 'projects.json', 'skills.json'] 
                  },
              ]);
              addAppLog('info', 'AI Assistant initialized with welcome message.', 'AI', { initialMessage: initialMessageText });
          } else {
              const errorMsg = "AI Assistant is currently unavailable. The API key has not been configured for this application.";
              setMessages([
                  {
                  id: crypto.randomUUID(),
                  text: errorMsg,
                  sender: 'ai',
                  timestamp: new Date(),
                  error: true,
                  },
              ]);
              addAppLog('error', errorMsg, 'AI');
              playSound('error');
          }
      }
    });
    return () => { cancelled = true; };
  }, [addAppLog]); // Removed messages from dependency array to prevent re-initialization on every message change

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !apiKeyAvailable) return;

    const userMessageText = input.trim();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    playSound('ui-click');
    addAppLog('action', `User message sent to AI: "${userMessageText.substring(0,100)}${userMessageText.length > 100 ? '...' : ''}"`, 'User');

    try {
      const prompt = getContextualPrompt(userMessage.text, portfolioData);
      addAppLog('debug', 'Generated contextual prompt for AI.', 'AI', { promptLength: prompt.length });
      
      const responseText = await callGemini({ task: 'chat', prompt });

      let aiResponseText = responseText || "Sorry, I couldn't generate a response.";
      let recommendedFiles: string[] = [];

      
      const recommendationBlockRegex = /%%FILE_RECOMMENDATIONS%%([\s\S]*?)%%END_FILE_RECOMMENDATIONS%%/;
      const match = aiResponseText.match(recommendationBlockRegex);

      if (match && match[1]) {
        const fileListText = match[1].trim();
        
        recommendedFiles = fileListText.split('\n') // Split by newline
          .map(line => line.trim().match(/^\[(.*?)\]$/)) // Match [filename.ext]
          .filter(Boolean) // Filter out null matches (lines not matching format)
          .map(fileMatch => (fileMatch as RegExpMatchArray)[1]); // Extract filename
        
        
        aiResponseText = aiResponseText.replace(recommendationBlockRegex, '').trim();
        if (aiResponseText.length === 0 && recommendedFiles.length > 0) {
             aiResponseText = "Here are some files you might find relevant:"; 
        }
      }
      
      const aiMessage: ChatMessage = {
        id: `${TYPING_ANIMATION_ID_PREFIX}${crypto.randomUUID()}`, 
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
        recommendedFiles: recommendedFiles.length > 0 ? recommendedFiles : undefined,
      };
      setMessages(prev => [...prev, aiMessage]);
      addAppLog('info', `AI response received: "${aiResponseText.substring(0,100)}${aiResponseText.length > 100 ? '...' : ''}"`, 'AI', { recommendedFiles });
      playSound('chat-receive');

    } catch (e: any) {
      console.error("Error calling Gemini API:", e);
      const errorMsg = "Sorry, an error occurred while contacting the AI. Please try again.";
      setError(errorMsg);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        text: "Sorry, I faced an issue trying to respond. Please check the connection or try again later.",
        sender: 'ai',
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      addAppLog('error', 'Error calling Gemini API.', 'AI', { error: e.message || String(e) });
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, apiKeyAvailable, portfolioData, addAppLog]); 

  return {
    messages,
    setMessages, 
    input,
    setInput,
    isLoading,
    error,
    apiKeyAvailable,
    handleSendMessage,
  };
};
