import { google } from "@ai-sdk/google";
import { generateText } from "ai"
import 'dotenv/config';

interface AiResponse {
    model: string,
    response: string
}

export interface TaskSummaryInput {
    completedTasks: { content: string, description?: string, labels?: string[] }[];
    inProgressTasks: { content: string, description?: string, labels?: string[] }[];
    priorityTasks: { content: string, description?: string, labels?: string[] }[];
}

const prompt = "choose a number between 1 and 100 and tell me"

const generateTextFromLocal = async () => {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'qwen2.5:3b',
                prompt: prompt,
                stream: false,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const aiResponse = result as AiResponse;
        console.log("From local", aiResponse.response);
    } catch (error) {
        console.error("Error generating text from local API:", error);
    }
};

const generateTextFromGoogle = async () => {
    try {
        const { text } = await generateText({
            model: google("gemini-2.0-flash-lite"),
            prompt: prompt
        });
        console.log("From Google", text);
    } catch (error) {
        console.error("Error generating text from Google API:", error);
    }
}

export const generateStandupSummary = async (taskData: TaskSummaryInput): Promise<string> => {
    try {
        const system = `You are an AI standup summary generator. Your task is to create a professional, concise, and insightful daily standup summary based on the provided task information.
        A good standup summary should:
        - Synthesize information rather than just listing tasks
        - Group related tasks together when appropriate
        - Highlight key accomplishments and challenges
        - Be written in first-person professional language
        - Be concise but informative
        - Include specific details where relevant

        Format the summary in these sections:
        1. What I completed yesterday - Summarize completed tasks, grouping related items and highlighting key accomplishments
        2. What I'm working on today - Describe current focus areas based on in-progress and priority tasks
        3. Any blockers or issues I'm facing - Mention any challenges or dependencies that might be slowing progress

        Write in a professional first-person voice and make the summary informative yet concise.
        `
        const promptTemplate = `
            Here are the tasks to summarize:

            COMPLETED TASKS:
            ${taskData.completedTasks.map(task => `- ${task.content}${task.description ? ` (${task.description})` : ''}${task.labels?.length ? ` [${task.labels.join(', ')}]` : ''}`).join('\n')}

            IN PROGRESS TASKS:
            ${taskData.inProgressTasks.map(task => `- ${task.content}${task.description ? ` (${task.description})` : ''}${task.labels?.length ? ` [${task.labels.join(', ')}]` : ''}`).join('\n')}

            TODO TASKS:
            ${taskData.priorityTasks.map(task => `- ${task.content}${task.description ? ` (${task.description})` : ''}${task.labels?.length ? ` [${task.labels.join(', ')}]` : ''}`).join('\n')}
        `;

        // Prompt template is ready for AI processing
        try {
            // Try Google API first
            const { text } = await generateText({
                model: google("gemini-2.0-flash-lite"),
                prompt: promptTemplate,
                system: system
            });
            return text;
        } catch (error) {
            console.error("Error generating text from Google API, falling back to local:", error);

            // Fall back to local API
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen2.5:3b',
                    prompt: promptTemplate,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const aiResponse = result as AiResponse;
            return aiResponse.response;
        }
    } catch (error) {
        console.error("Error generating standup summary:", error);
        return "Failed to generate standup summary. Please try again later.";
    }
};

// Uncomment to test the AI services
// generateTextFromGoogle()
// generateTextFromLocal()
