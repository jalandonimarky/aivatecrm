# AI Rules for this Project

This document outlines the core technologies used in this project and provides guidelines on which libraries to use for specific functionalities.

## Tech Stack Overview

*   **React**: A JavaScript library for building user interfaces.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and maintainability.
*   **Vite**: A fast build tool that provides a lightning-fast development experience.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and styled with Tailwind CSS.
*   **React Router**: A standard library for routing in React applications.
*   **Supabase**: An open-source Firebase alternative providing a PostgreSQL database, authentication, and more.
*   **React Query**: A powerful library for fetching, caching, synchronizing, and updating server state.
*   **Lucide React**: A collection of beautiful and customizable SVG icons.
*   **Recharts**: A composable charting library built with React and D3.

## Library Usage Guidelines

To maintain consistency and efficiency, please adhere to the following guidelines when implementing features:

*   **UI Components**: Always prioritize using components from `shadcn/ui`. If a required component is not available or needs significant customization, create a new component in `src/components/` and style it using Tailwind CSS. **Do not modify existing `src/components/ui` files.**
*   **Styling**: All styling must be done using **Tailwind CSS**. Leverage the custom design tokens defined in `src/index.css` and `tailwind.config.ts`.
*   **Routing**: Use **React Router (react-router-dom)** for all client-side navigation. All main application routes should be defined in `src/App.tsx`.
*   **State Management & Data Fetching**: For managing server state and handling data fetching, use **React Query (@tanstack/react-query)**. For local component state, use React's built-in `useState` and `useReducer` hooks.
*   **Icons**: Use **Lucide React (lucide-react)** for all icons throughout the application.
*   **Forms**: For form management and validation, use **React Hook Form (react-hook-form)** in conjunction with **Zod (zod)** for schema definition and validation.
*   **Toasts/Notifications**: For displaying transient notifications to the user, use **Sonner (sonner)**.
*   **Date Handling**: For any date parsing, formatting, or manipulation, use **date-fns**.
*   **Backend/Database Interactions**: All interactions with the backend database (PostgreSQL) and authentication should be done via the **Supabase client** imported from `src/integrations/supabase/client.ts`.
*   **Charting**: For any data visualization or charts, use **Recharts (recharts)**.