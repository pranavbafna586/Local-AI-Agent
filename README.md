# LokAI - Document Q&A Platform

LokAI is an intelligent document question-answering platform that allows users to upload documents in various formats (PDF, Word, Excel, and images) and ask questions about their content. The application uses advanced AI technology from GROQ to provide accurate answers based on the document content.

## Features

- **Multiple Document Format Support**: Upload PDF, Word documents, Excel spreadsheets, and images
- **OCR Technology**: Extract text from images using Tesseract OCR
- **Interactive Chat Interface**: Ask questions about your documents and get AI-powered responses
- **Modern UI**: Clean, professional, and responsive design using Tailwind CSS
- **Real-time Processing**: See the progress of document processing in real-time

## Technology Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: GROQ API
- **Document Processing**:
  - PDF parsing with pdf.js
  - Word document parsing with mammoth.js
  - Excel parsing with xlsx.js
  - Image OCR with Tesseract.js

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/lokai.git
cd lokai
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your GROQ API key:

```
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

4. Start the development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Upload a document using the document uploader.
2. Click "Process Document" to extract text from the document.
3. Once processing is complete, ask questions about the document in the chat interface.
4. Get AI-powered responses based on the content of your document.
