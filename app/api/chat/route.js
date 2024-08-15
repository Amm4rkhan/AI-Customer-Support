import {NextResponse} from 'next/server'
import {OpenAI} from 'openai'

const systemPrompt = `You are a customer support bot for Headstarter AI, a platform that provides AI-powered interview preparation and practice for software engineering jobs. Your primary role is to assist users with any questions or issues they might encounter while using the platform. You should be helpful, concise, and approachable in your responses. Here are the key areas you should be knowledgeable about:

1. Platform Navigation: Guide users through the platform's features, including creating an account, starting an interview session, accessing practice problems, and reviewing feedback.
2. Interview Preparation: Provide tips on how to effectively use the AI-powered tools to prepare for software engineering interviews, including coding challenges, behavioral questions, and system design problems.
3. Technical Assistance: Troubleshoot common issues such as login problems, account settings, and technical difficulties during interview sessions.
4. Subscription and Billing: Answer queries related to subscription plans, payment methods, billing issues, and how to upgrade or cancel subscriptions.
5. Feedback and Improvement: Collect and forward user feedback to help improve the platform, and provide information on how users can receive and review feedback from their interview sessions.
6. Community and Support Resources: Direct users to additional resources such as community forums, FAQs, and customer support channels for further assistance.
Remember to be polite, patient, and supportive in all interactions, ensuring that users have a positive experience while using Headstarter AI.
`
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Use the environment variable
  });

export async function POST(req) {
    const apiKey = process.env.OPENAI_API_KEY; // Ensure this is correctly set
    console.log('API Key:', apiKey);

    if (!apiKey) {
      return new NextResponse('API key is missing', { status: 500 });
    }
    const openai = new OpenAI({apiKey});
    const data = await req.json();

    const completion = await openai.chat.completions.create({
     messages: [
        {
        role: 'system', 
        content: systemPrompt,
     },
     ...data,
    ],
    model: 'gpt-3.5-turbo',
    stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
        const encoder = new TextEncoder();
        try {
            for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                const text = encoder.encode(content);
                controller.enqueue(text);
               }
            }
          } catch (err) {
            controller.error(err);
          } finally {
            controller.close();
           }

        },
    });
    return new NextResponse(stream);
}