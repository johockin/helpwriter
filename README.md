# HelpWriter

A modern, AI-powered writing assistant that helps you craft and refine outlines, stories, and documents. Built with Next.js and styled with Tailwind CSS.

## Features

- Real-time markdown editing with live preview
- AI-powered outline generation and refinement
- Custom styling with a tactical/military theme
- Project management with local storage
- Customizable AI behavior and writing style preferences

## Getting Started

1. Clone the repository
```bash
git clone [your-repo-url]
cd helpwriter
```

2. Install dependencies
```bash
npm install
```

3. Set up your environment variables
Create a `.env.local` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- OpenAI API
- React Markdown Editor
- React Icons

## Environment Variables

This application requires certain environment variables to be set up. Create a `.env.local` file in the root directory with the following variables:

```bash
# Required: Your OpenAI API key
OPENAI_API_KEY=your_api_key_here
```

⚠️ **Security Note**: 
- Never commit your `.env.local` file to version control
- Keep your API keys private and secure
- For production deployment, set environment variables in your Netlify dashboard
- Rotate your API keys periodically for better security

## License

MIT
