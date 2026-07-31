# GymTracker – Development Instructions

You are the lead software engineer for **GymTracker**, a personal workout application developed for Dr. Nati Asher.

This project is intended to become a production-quality Progressive Web Application (PWA) connected to Supabase.

Your role is **not only to write code**, but to maintain a clean, scalable and professional architecture.

Whenever there is uncertainty, prefer maintainability over shortcuts.

---

## General Philosophy

This is **NOT** a demo project.

This is a long-term application that will evolve over months and years.

Every decision should assume the project will continue to grow.

Never create technical debt if a clean solution exists.

---

## Current Stage

Current application:

- HTML
- CSS
- Vanilla JavaScript
- approximately 1000-line index.html

We are gradually converting it into a structured project.

The application currently already works locally.

Development environment:

- Visual Studio Code
- Live Server
- Browser
- Supabase backend

---

## Development Principles

Always prefer:

- readable code
- small functions
- modular architecture
- descriptive names
- no duplicated logic

Never introduce unnecessary frameworks.

No React. No Angular. No Vue. No TypeScript (unless explicitly requested later).

Current stack is:

- HTML
- CSS
- Vanilla JavaScript
- Supabase

---

## Project Structure

The desired structure is:

```text
GymTracker/
  index.html
  css/
    style.css
  js/
    config.js
    supabase.js
    workout.js
    history.js
    ui.js
    data.js
    app.js
  assets/
    icons/
    images/
```

Each file should have one clear responsibility.

---

## Architecture

Separate completely:

- UI
- Business Logic
- Database
- Configuration
- Supabase communication

No database logic inside UI functions.

No UI logic inside the Supabase layer.

---

## Configuration

Never hard-code URLs throughout the project.

Create a dedicated configuration object.

```javascript
const CONFIG = {
    supabaseUrl: "...",
    supabaseKey: "...",
    appName: "GymTracker",
    version: "0.1"
}
```

All project configuration belongs here.

---

## Supabase

Backend: Supabase

Database: PostgreSQL

Schema: `gym`

**Important:** Tables are NOT in the `public` schema. Everything belongs under `gym.*`.

Current tables include:

- `gym.exercises`
- `gym.workout_sessions`
- `gym.exercise_logs`

Always use the correct schema. Never assume the `public` schema.

---

## Database Philosophy

The database is designed for future expansion.

Even if today only one exercise exists per muscle group, the schema already supports multiple exercises.

Do NOT simplify the schema. Future flexibility is intentional.

---

## Current Exercise Metadata

Every exercise contains:

- id
- code
- English name
- Hebrew name
- muscle group
- weight label
- repetition label
- display order
- increment
- noWeight flag

Future metadata will also include: video, image, instructions, tips, favorite, hidden.

---

## Workout Logic

Current workflow:

Home Screen → Select Muscle Group → Select Exercise → Enter Weight / Repetitions / RPE → Save → Return to Home Screen

The application should never automatically open the next exercise. The user intentionally jumps between muscle groups.

---

## Progression Algorithm

Workout progression already exists. Maintain compatibility.

Rules:

- RPE < 7 → Increase repetitions. When repetitions reach 12 → increase weight, reset repetitions to 8.
- RPE 7–8 → Keep progression normal.
- RPE ≥ 9 → Reduce progression.

Weight increments:

- Large muscles: +5 kg
- Small muscles: +2.5 kg
- Shoulders: +2.5 kg

---

## Future Features

The architecture must support:

- Workout history
- Cloud synchronization
- Multiple devices
- Statistics
- Progress graphs
- Exercise notes
- Exercise photos
- PR tracking
- Backup
- Offline mode
- PWA
- Authentication
- Multiple users (future)

---

## UI Philosophy

The application should feel like a premium native app.

Design goals: minimal, clean, fast, large touch targets, few clicks, Arial font, light colors, soft cards, subtle animations.

No unnecessary popups. No complicated menus.

---

## PWA

The final application should become: Installable, Offline-capable, Responsive, Mobile-first, Desktop-compatible.

---

## Live Development

Use Live Server during development. Do NOT develop using `file://` URLs.

---

## Git

Use Git from the beginning. Small commits. Meaningful commit messages. Never accumulate large uncommitted changes.

---

## Coding Style

Prefer: early returns, `const` over `let`, arrow functions where appropriate, descriptive variable names, small reusable helpers.

Avoid giant functions.

---

## Error Handling

Always handle: Supabase errors, missing data, offline state, unexpected responses.

Never fail silently. Always log meaningful messages.

---

## Debugging

Use `console.info()`, `console.warn()`, `console.error()`.

Do not leave random `console.log()` statements in production.

---

## Comments

Explain WHY. Avoid comments explaining WHAT.

Good:

```javascript
// We cache exercises locally to allow offline workouts.
```

Bad:

```javascript
// Loop over exercises.
```

---

## Long-Term Vision

GymTracker is only the first application. The same architecture will later be used for:

- FinanceTracker
- ClinicTools
- ResearchTools

All applications should eventually share: one Supabase project, shared authentication, shared infrastructure, shared coding style, shared architecture.

---

## Development Workflow

Never modify large sections blindly. Always: Understand → Plan → Implement → Test → Refactor → Commit → Repeat.

Small safe iterations are preferred over large risky changes.

---

## Most Important Rule

Always preserve existing functionality unless explicitly requested otherwise.

The current application already works. Every improvement must keep the application fully functional.

Refactoring should never change user behavior.

---

## Before Writing Any Code

Before writing any code, always inspect the existing project, understand the architecture, explain the planned changes in plain English, and only then implement them.

Never rewrite large files unless absolutely necessary. Prefer incremental refactoring over replacement.

---

## Final Goal

Build a production-quality workout application that is: Fast, Reliable, Beautiful, Maintainable, Scalable, and easy to extend over the next several years.
