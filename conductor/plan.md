# Objective
Transform the single-file plotting tool into a robust, multi-file web application with a refined UI, modular architecture, and support for multiple data "systems" (sessions, formats).

# Key Files
- `index.html`: Main shell with sidebar navigation.
- `src/css/styles.css`: Custom CSS for refined dark mode and layout.
- `src/js/parser.js`: Modular logic for parsing different data formats.
- `src/js/charts.js`: Logic for managing and rendering Plotly charts.
- `src/js/app.js`: Main application controller and state management.

# Implementation Steps

## 1. Modularize Codebase
- Split the monolithic `index.html` into a clean structure.
- Create a `src/` directory for JS and CSS assets.

## 2. Refined UI Design (Sidebar & Dashboard)
- **Sidebar**: Add a navigation sidebar with icons (Home/Dashboard, Plotter, History).
- **Dashboard View**: Create a "Real-time" view that shows the latest telemetry values in "Info Cards" (tiles).
- **Plotter View**: Enhanced version of the current plotter with better controls.
- **Glassmorphism/Modern Look**: Use Tailwind with custom gradients and refined borders for a premium feel.

## 3. "Support Systems" & Enhanced Features
- **Format Support**: Extend `parser.js` to handle:
  - The custom `>Key:Value` format.
  - Standard CSV.
  - JSON arrays.
- **Session Management**: Allow users to "Save Session" to `localStorage` and switch between them.
- **Export System**: Add functionality to download the parsed data as CSV or the charts as images.

## 4. State Management (Vanilla JS)
- Implement a simple state object to track the current view and the active data session.
- Handle view switching without full page reloads.

# Verification & Testing
- Test parsing with all three formats (Custom, CSV, JSON).
- Verify that the Dashboard correctly displays the "latest" values from a multi-block telemetry string.
- Ensure the sidebar navigation works correctly and persists state.
- Check responsiveness on mobile/tablet.