import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const aiService = {
  async generateResponse(messages, model = 'gpt-4') {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  },

  async generateMacro(userInput, pageContext) {
    const prompt = `
      Based on the user's input and page context, generate a macro that can be executed.
      User input: ${userInput}
      Page context: ${JSON.stringify(pageContext)}
      
      Generate a macro that:
      1. Has a clear name and description
      2. Contains the necessary actions to accomplish the task
      3. Is safe and follows best practices
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error generating macro:', error);
      throw error;
    }
  },

  async analyzeScreenshot(imageBase64) {
    const prompt = `
      Analyze this screenshot and provide:
      1. A description of what's visible
      2. Potential actions that could be taken
      3. Any relevant text or elements that could be interacted with
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      throw error;
    }
  }
}; 