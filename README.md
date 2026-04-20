# Wellms Frontend

A student-facing Learning Management System (LMS) built with Next.js 16 and React 19. Students can browse and enroll in courses, track their progress, consume diverse content types, and download completion certificates.

## Features

- **Course catalogue** — search by title and filter by category
- **Course detail pages** — description, curriculum overview, author info, and one-click free enrollment
- **Topic player** — supports Video, Audio, Rich Text, Images, PDF, H5P, SCORM, and OEmbed content
- **Progress tracking** — per-topic completion with auto-advance and sidebar navigation
- **Dashboard** — enrolled courses with progress percentages and quick resume
- **Certificates** — completion screen with PDF download
- **Authentication** — register, login, forgot/reset password
- **Profile management** — avatar upload, personal details, password change

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript 5 |
| Backend SDK | [@escolalms/sdk](https://github.com/EscolaLMS/sdk) |
| Testing | Jest 30, React Testing Library |
| Linting | ESLint 9 |

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
app/
  components/        # Shared UI components
  courses/
    [id]/            # Course detail page
      topics/[topicId]/  # Topic player
      complete/      # Certificate page
  dashboard/         # User's enrolled courses
  profile/           # Account settings
  register/          # Registration
  forgot-password/   # Password recovery
__tests__/           # Jest test files
```
