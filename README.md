# MedTrace 🏥

**MedTrace** is an AI-powered personal medical record management and secure sharing platform. Built as a fast, beautiful, and secure solution for patients to digitize their medical history, MedTrace uses AI to automatically extract, structure, and simplify complex medical documents.

Live URL: https://medtrace-phi.vercel.app

## ✨ Features

- **Smart Digitization:** Upload files (PDF/JPG/PNG) or directly scan physical documents using your mobile camera.
- **AI-Powered Extraction:** Automatically extracts key data such as hospital name, doctor, dates, lab results, and medications using OCR and LLM technology.
- **Patient-Friendly Summaries:** Translates complex medical jargon into easy-to-understand summaries.
- **Intelligent Organization:** Documents are automatically grouped by healthcare provider and sorted chronologically based on the actual date of the medical event (not just the upload date).
- **Secure Storage:** All files and data are securely stored using Supabase Authentication and private storage buckets.
- **Premium UI:** A highly polished, responsive interface featuring glassmorphism, smooth staggered animations, and dynamic floating action buttons.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React (Icons)
- **Backend & Auth:** Supabase (PostgreSQL, Storage, Authentication)
- **AI Integration:** Ready for OCR/Multimodal LLM integration via a secure backend endpoint.

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/medtrace.git
   cd medtrace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Integration Flags
   VITE_USE_MOCK_AI=true
   VITE_AI_API_URL=http://localhost:8000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 👨‍💻 Developed By

- **Jeeval Jolly Jacob**
- **Hannah Raichel Philip**
