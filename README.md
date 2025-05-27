# LifeQuest RPG: Gamified Habit Tracker and Task Manager

## Description
LifeQuest RPG is a Next.js application designed to help users build habits and manage tasks in a fun and engaging way, drawing inspiration from role-playing games (RPGs). Users can level up, earn rewards, and track their progress as they complete real-life habits and tasks. The application integrates AI-powered features to suggest disciplines and generate player stats.

## Tech Stack
*   **Framework:** Next.js (v15.x)
*   **Language:** TypeScript
*   **UI Components:** Shadcn/UI, Radix UI
*   **State Management:** Zustand (based on `use-life-quest-store.tsx`)
*   **Forms:** React Hook Form with Zod resolver
*   **Backend & Database:** Firebase (Authentication, Firestore, Storage)
*   **AI Integration:** Genkit (with Google AI)
*   **Styling:** Tailwind CSS
*   **PWA:** next-pwa
*   **Linting/Formatting:** ESLint, Prettier (assumed, standard for Next.js)
*   **Package Manager:** npm

## Project Structure
*   `public/`: Static assets, including the PWA manifest (`manifest.json`).
*   `src/`: Source code for the application.
    *   `ai/`: Contains Genkit AI flows and schemas.
        *   `flows/`: Specific AI generation logic (e.g., player stats, discipline suggestions).
        *   `schemas/`: Zod schemas for AI data.
    *   `app/`: Next.js App Router, defining routes and layouts.
        *   `(app)/`: Authenticated routes (dashboard, habits, tasks, etc.).
        *   `(auth)/`: Authentication routes (login, register).
    *   `components/`: Reusable React components.
        *   `auth/`: Authentication-related components.
        *   `dashboard/`: Components for the main user dashboard.
        *   `habits/`, `tasks/`, `rewards/`, `quiz/`: Components specific to these features.
        *   `layout/`: Layout components (header, sidebar, bottom navigation).
        *   `ui/`: Core UI elements (buttons, cards, dialogs - likely from Shadcn/UI).
    *   `config/`: Application-level configurations (e.g., avatar, game settings).
    *   `hooks/`: Custom React hooks (e.g., `use-auth`, `use-life-quest-store`).
    *   `lib/`: Utility functions and Firebase setup.
    *   `types/`: TypeScript type definitions.
*   `docs/`: Project documentation (e.g., `blueprint.md`).
*   `next.config.ts`: Next.js configuration file, including PWA setup.
*   `firebase.json`: Firebase project configuration (hosting, functions).
*   `package.json`: Project dependencies and scripts.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `tsconfig.json`: TypeScript configuration.

## Getting Started

### Prerequisites
*   Node.js (v20 or later recommended)
*   npm (comes with Node.js)
*   Firebase CLI (for deployment and local emulation, if needed): `npm install -g firebase-tools`
*   Access to a Firebase project with Authentication, Firestore, and Storage enabled.

### Installation
1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Configuration
1.  Create a `.env.local` file in the root of the project.
2.  Add your Firebase project configuration to `.env.local`. You can get these details from your Firebase project settings:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id" # Optional

    # For Genkit/Google AI
    GOOGLE_API_KEY="your-google-ai-api-key"
    ```
    *Note: Ensure that `GOOGLE_API_KEY` has access to the necessary Google AI models (e.g., Gemini).*

### Running the Development Server
1.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:9002`.
2.  (Optional) If you need to run Genkit flows locally for development or testing AI features:
    ```bash
    npm run genkit:dev
    ```
    Or with watching for changes:
    ```bash
    npm run genkit:watch
    ```

## Building and Deployment

### Building
To create a production build:
```bash
npm run build
```
This will generate an optimized version of your application in the `.next` directory.

### Deployment
The project is configured for deployment to Firebase Hosting.
1.  Make sure you have the Firebase CLI installed and are logged in (`firebase login`).
2.  Associate your local project with your Firebase project:
    ```bash
    firebase use <your-firebase-project-id>
    ```
3.  Deploy to Firebase Hosting:
    ```bash
    firebase deploy --only hosting
    ```
    The `firebase.json` configuration handles the setup for Firebase Hosting, including serving the Next.js application via Firebase Functions (`frameworksBackend`).

## Available Scripts
*   `npm run dev`: Starts the Next.js development server with Turbopack.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with file watching.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a Next.js production server (after building).
*   `npm run lint`: Runs ESLint to check for code quality and style issues.
*   `npm run typecheck`: Runs the TypeScript compiler to check for type errors.

## PWA Configuration
This project is configured as a Progressive Web App (PWA) using `next-pwa`.
*   The PWA configuration is managed in `next.config.ts`.
*   Service worker registration and caching strategies are defined there.
*   The manifest file is located at `public/manifest.json`.
*   PWA features are disabled in development mode (`process.env.NODE_ENV === 'development'`).

## AI Features
The application leverages Genkit and Google AI to provide intelligent features:
*   **Player Stats Generation:** AI is used to generate dynamic player statistics based on user activities or other inputs (see `src/ai/flows/generate-player-stats-flow.ts`).
*   **Discipline Suggestions:** AI can suggest relevant disciplines or areas of focus for the user (see `src/ai/flows/suggest-disciplines-flow.ts`).
*   The core AI setup and Genkit initialization can be found in `src/ai/genkit.ts` and `src/ai/dev.ts` for development.

## Contributing
Details to be added.

## License
To be determined.
