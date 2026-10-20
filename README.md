# Mpingo Seed-to-Tree Network

The Mpingo Seed-to-Tree Network is a conservation technology platform designed for the Mpingo Restoration Initiative (MRI). It coordinates the lifecycle of Mpingo restoration: Seed Collection $\rightarrow$ Nursery Production $\rightarrow$ Distribution $\rightarrow$ Planting $\rightarrow$ Survival Monitoring $\rightarrow$ Reporting.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20.x or higher is required.
- **Package Manager**: `npm` (installed with Node.js).
- **Supabase Account**: A free or paid account at [supabase.com](https://supabase.com).

### 1. Installation

Clone the repository and install the dependencies:

```bash
# Clone the project
git clone <repository-url>
cd mpingo

# Install dependencies
npm install
```

### 2. Supabase Configuration

This project uses Supabase for authentication, database, and storage.

1. **Create a New Project**: Create a project in the Supabase dashboard.
2. **Environment Variables**: Create a `.env.local` file in the root directory:
   ```bash
   touch .env.local
   ```
3. **Add Your Credentials**: Copy the following into `.env.local` and replace the placeholders with values from your Supabase project settings (**Project Settings > API**):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### 3. Local Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 🛠 Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with hot-reloading. |
| `npm run build` | Builds the application for production. |
| `npm run start` | Starts the built production application. |
| `npm run lint` | Runs ESLint to check for code quality and type issues. |

## 📖 Project Documentation

Detailed specifications and tracking can be found in the `/docs` directory:
- [Product Specification](docs/PRODUCT_SPEC.md) - Architecture, RBAC, and workflow.
- [Build Status](docs/BUILD_STATUS.md) - Current milestone and implementation progress.
