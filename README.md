# Crafty Studio

Платформа генерации контента для бизнеса. Создавайте тексты, изображения, видео и озвучку с помощью AI‑воркфлоу без кода.

## Features

- **Visual Workflow Builder**: Create AI workflows by connecting nodes in an intuitive drag-and-drop interface
- **Multiple AI Models**: Seamlessly integrate with leading AI models from various providers
- **Multimedia Processing**: Process images, text, audio, and video content through your workflows
- **Automatic Saving**: Changes are automatically saved to your projects
- **Cloud Storage**: All workflows are securely stored in Supabase with Row Level Security enabled
- **Modern UI**: Clean, responsive interface built with Next.js, React, and Tailwind CSS

## Technologies

- Next.js 15 (App Router, Turbopack)
- React 19
- Supabase (аутентификация и хранение данных)
- Vercel AI SDK (интеграция AI‑моделей)
- ReactFlow (визуальное полотно)
- TipTap (rich‑text)
- Drizzle ORM (запросы к БД)
- Tailwind CSS (стили)
- shadcn/ui, Kibo UI, Radix UI (компоненты)

## Getting Started

### Prerequisites

- Node.js (v20+)
- PNPM package manager
- Supabase account and project
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) installed
- [Stripe CLI](https://docs.stripe.com/stripe-cli) installed

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/haydenbleasel/crafty.git
   cd crafty
   ```

2. Install dependencies
   ```sh
   pnpm install
   ```

3. Create a `.env.local` file in the root directory with your environment variables. Check the `lib/env.ts` file for all the variables you need to set.

4. Run the development server
   ```sh
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Login or create an account
2. Create a new project or open an existing one
3. Add nodes to your canvas by clicking the toolbar buttons
4. Connect nodes by dragging from one node's output to another node's input
5. Configure node settings as needed
6. Run your workflow to process data through the AI models

## Примечание

Этот репозиторий используется как основа для Crafty Studio.
