# FrontSeat Ad Hub

A sophisticated advertising platform for ride-sharing vehicles, built with React, TypeScript, and Firebase.

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Set up environment variables
npm run setup-env

# Verify setup
npm run verify-setup
```

### 2. Firebase Configuration
1. Get your Firebase config from [Firebase Console](https://console.firebase.google.com/)
2. Update `.env.local` with your Firebase configuration
3. Enable Email/Password authentication in Firebase Console

### 3. Start Development
```bash
npm run dev
```

## 📚 Documentation

- [Firebase Setup Guide](FIREBASE_SETUP.md) - Complete Firebase configuration
- [Environment Setup](ENV_SETUP.md) - Environment variables guide
- [Database Schema](database_schema.txt) - Complete database design

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run setup-env` - Set up environment variables
- `npm run verify-setup` - Verify project setup
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── firebase/           # Firebase configuration and utilities
├── pages/              # Page components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

## 🔐 Authentication

The app includes a complete authentication system with:
- Email/Password sign up and sign in
- Protected routes
- User context management
- Advertiser profile creation

## 🎨 UI Components

Built with shadcn/ui and Tailwind CSS:
- Glassmorphism design
- Responsive layout
- Dark theme support
- Smooth animations

## 📊 Features

- **Campaign Management**: Create, edit, and manage advertising campaigns
- **Analytics Dashboard**: Real-time metrics and KPIs
- **User Management**: Multi-user advertiser accounts
- **Responsive Design**: Works on all devices

## 🔧 Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Lucide React
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State Management**: React Context, TanStack Query
- **Routing**: React Router DOM

## 📞 Support

For setup issues or questions, check the documentation files or run `npm run verify-setup` to diagnose problems.

---

## Project info

**URL**: https://lovable.dev/projects/22b34937-d776-49ad-bf25-7dd8d3c03836

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/22b34937-d776-49ad-bf25-7dd8d3c03836) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/22b34937-d776-49ad-bf25-7dd8d3c03836) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
