
import { PortfolioData, WorkExperienceEntry, ProjectDetail, LogLevel, AIValidationStatus, ChatMessage } from '../App/types';
import { generateFileContent } from '../App/constants';
import { callGemini, isGeminiAvailable } from './geminiClient';

// Build the system context block once per session
export const buildSystemContext = (portfolioData: PortfolioData): string => {
    const about = JSON.parse(generateFileContent('about.json', portfolioData));
    const experience = JSON.parse(generateFileContent('experience.json', portfolioData));
    const skills = JSON.parse(generateFileContent('skills.json', portfolioData));
    const projectsList = JSON.parse(generateFileContent('projects.json', portfolioData)).projects;
    const projectTitles = projectsList.map((p: {id: string, title: string}) => p.title).join(', ');

    const contactDetails = [];
    if (portfolioData.email) contactDetails.push(`Email: ${portfolioData.email}`);
    if (portfolioData.phone) contactDetails.push(`Phone: ${portfolioData.phone}`);
    if (portfolioData.linkedIn) contactDetails.push(`LinkedIn: ${portfolioData.linkedIn}`);
    if (portfolioData.instagram) contactDetails.push(`Instagram: ${portfolioData.instagram}`);
    if (portfolioData.tiktok) contactDetails.push(`TikTok: ${portfolioData.tiktok}`);
    if (portfolioData.otherSocial) contactDetails.push(`${portfolioData.otherSocial.name}: ${portfolioData.otherSocial.url}`);

    const availableFiles = ['about.json', 'experience.json', 'skills.json', 'projects.json', 'contact.json'];

    return `You are a friendly, professional, and helpful AI assistant for Nandang Eka Prasetya's portfolio.
You are embedded in Nandang's interactive portfolio website, which is designed to look and feel like Visual Studio Code.
Your goal is to answer questions about Nandang, his skills, experience, projects, and this website itself, based ONLY on the information provided below.
Do not make up information or answer questions outside of this context. If the answer is not in the provided information, politely state that you don't have that specific detail.
Keep your answers concise and well-formatted using Markdown.

**IMPORTANT: Response Format**
At the VERY END of EVERY response, you MUST output a special JSON block (even if there are no file recommendations or follow-ups).
The block must look exactly like this example:

%%RESPONSE_META%%
{
  "recommendedFiles": ["about.json"],
  "followUpQuestions": ["What are his key skills?", "Can you show his projects?", "How can I contact him?"]
}
%%END_RESPONSE_META%%

Rules for the JSON block:
- "recommendedFiles": array of filenames from this list ONLY: ${availableFiles.join(', ')}. Empty array [] if none relevant.
- "followUpQuestions": array of exactly 3 short, specific follow-up questions the user might want to ask next. Always provide 3.
- Do NOT put any markdown or explanation inside the JSON block.

**About This Portfolio Website:**
- Built with React, TypeScript, and Vite. AI powered by Google Gemini.
- Navigate by clicking files in the 'Explorer' sidebar, or use Ctrl+Shift+P for the Command Palette.

**Nandang Eka Prasetya's Information:**
- **Name:** ${portfolioData.name} (nickname: ${portfolioData.nickname})
- **Role:** ${portfolioData.role || 'Full Stack Developer'}
- **Summary:** ${portfolioData.summary || 'Software developer.'}
- **Current Role:** ${about.current_position.role} at ${about.current_position.company} (${about.current_position.period})
  - ${about.current_position.description || ''}
- **Education:**
  ${about.education.map((edu: { school: string, major: string, period: string, gpa?: string}) => `  - ${edu.major} at ${edu.school} (${edu.period})${edu.gpa ? ', GPA: ' + edu.gpa : ''}`).join('\n  ')}
- **Contact & Socials:** ${contactDetails.join('; ')}
- **Key Skills:** ${skills.skills.join(', ')}
- **Work Experience:**
  ${(experience.work_experience as WorkExperienceEntry[]).map(exp =>
      `  - **${exp.role} at ${exp.company} (${exp.period})**\n    ${exp.description || ''}`
  ).join('\n  ')}
- **Projects:** ${projectTitles}`;
};

// Parse the %%RESPONSE_META%% block out of the AI response text
export const parseResponseMeta = (rawText: string): {
    cleanText: string;
    recommendedFiles: string[];
    followUpQuestions: string[];
} => {
    const metaBlockRegex = /%%RESPONSE_META%%\s*([\s\S]*?)\s*%%END_RESPONSE_META%%/;
    const match = rawText.match(metaBlockRegex);

    let recommendedFiles: string[] = [];
    let followUpQuestions: string[] = [];

    if (match && match[1]) {
        try {
            const parsed = JSON.parse(match[1].trim());
            recommendedFiles = Array.isArray(parsed.recommendedFiles) ? parsed.recommendedFiles : [];
            followUpQuestions = Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [];
        } catch (_) {
            // Malformed JSON — ignore gracefully
        }
    }

    const cleanText = rawText.replace(metaBlockRegex, '').trim();
    return { cleanText, recommendedFiles, followUpQuestions };
};

// Build the contents array for multi-turn conversation history
export const buildConversationContents = (
    userInput: string,
    history: ChatMessage[],
    systemContext: string
): string => {
    // Build conversation history string (last 10 messages max to avoid token overflow)
    const recentHistory = history.slice(-10);
    let historyText = '';
    if (recentHistory.length > 0) {
        historyText = '\n\n**Previous conversation:**\n' + recentHistory.map(msg =>
            `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text.substring(0, 500)}`
        ).join('\n');
    }

    return `${systemContext}${historyText}

Now answer the following:
User: ${userInput}
Assistant:`;
};

// Legacy single-turn prompt builder (kept for backward compat)
export const getContextualPrompt = (userInput: string, portfolioData: PortfolioData): string => {
    return buildConversationContents(userInput, [], buildSystemContext(portfolioData));
};


export const fetchAIProjectSuggestion = async (
    developerSkills: string[],
    addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void,
    userKeywords?: string
  ): Promise<Omit<ProjectDetail, 'id'> | null> => {
  addAppLog('debug', 'Requesting AI project suggestion.', 'AIService', { skills: developerSkills, userKeywords });
  try {
    const responseText = await callGemini({ task: 'suggest-project', skills: developerSkills, keywords: userKeywords });

    let jsonStr = responseText.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }

    const suggestedData = JSON.parse(jsonStr) as Omit<ProjectDetail, 'id'>;

    if (
      suggestedData &&
      typeof suggestedData.title === 'string' &&
      typeof suggestedData.description === 'string' &&
      Array.isArray(suggestedData.technologies) &&
      typeof suggestedData.year === 'number' &&
      Array.isArray(suggestedData.related_skills)
    ) {
      addAppLog('info', `Successfully parsed AI project suggestion: "${suggestedData.title}"`, 'AIService', { userKeywords });
      return suggestedData;
    } else {
      addAppLog('error', "AI project suggestion response has incorrect structure.", 'AIService', { responseData: suggestedData, userKeywords });
      return null;
    }
  } catch (error: any) {
    addAppLog('error', "Error fetching or parsing AI project suggestion.", 'AIService', { error: error.message || String(error), userKeywords });
    return null;
  }
};

export const validateGuestBookMessageWithGemini = async (
  message: string,
  addAppLog: (level: LogLevel, message: string, source?: string, details?: Record<string, any>) => void
): Promise<AIValidationStatus> => {
  if (!(await isGeminiAvailable())) {
    addAppLog('warning', "Gemini API is not configured on the server. Skipping guest book message validation.", 'GuestBookValidation');
    return 'validation_skipped';
  }

  addAppLog('debug', "Sending guest book message to Gemini for validation.", 'GuestBookValidation', { messageLength: message.length });

  try {
    const responseText = await callGemini({ task: 'moderate', message });

    const validationText = responseText.trim().toUpperCase();
    addAppLog('info', `Gemini validation response: ${validationText}`, 'GuestBookValidation');

    if (validationText === 'OK') {
      return 'validated_ok';
    } else if (validationText === 'FLAGGED') {
      return 'validated_flagged';
    } else {
      addAppLog('warning', `Unexpected response from Gemini validation: ${validationText}`, 'GuestBookValidation');
      return 'validation_error';
    }
  } catch (error: any) {
    addAppLog('error', "Error during Gemini guest book message validation.", 'GuestBookValidation', { error: error.message || String(error) });
    return 'validation_error';
  }
};
