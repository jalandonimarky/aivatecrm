// src/lib/kanban-colors.ts

export const kanbanBoardColors = [
  {
    key: 'mint',
    name: 'Mint',
    light: 'linear-gradient(135deg, hsl(150, 70%, 92%) 0%, hsl(0, 0%, 98%) 100%)',
    dark: 'linear-gradient(135deg, hsl(150, 42%, 20%) 0%, hsl(150, 42%, 12%) 100%)',
  },
  {
    key: 'sky',
    name: 'Sky',
    light: 'linear-gradient(135deg, hsl(210, 80%, 92%) 0%, hsl(0, 0%, 98%) 100%)',
    dark: 'linear-gradient(135deg, hsl(210, 69%, 25%) 0%, hsl(210, 69%, 15%) 100%)',
  },
  {
    key: 'peach',
    name: 'Peach',
    light: 'linear-gradient(135deg, hsl(30, 80%, 92%) 0%, hsl(0, 0%, 98%) 100%)',
    dark: 'linear-gradient(135deg, hsl(30, 42%, 25%) 0%, hsl(30, 42%, 15%) 100%)',
  },
  {
    key: 'lavender',
    name: 'Lavender',
    light: 'linear-gradient(135deg, hsl(250, 80%, 94%) 0%, hsl(0, 0%, 98%) 100%)',
    dark: 'linear-gradient(135deg, hsl(250, 42%, 25%) 0%, hsl(250, 42%, 15%) 100%)',
  },
  {
    key: 'yellow',
    name: 'Soft Yellow',
    light: 'linear-gradient(135deg, hsl(50, 80%, 92%) 0%, hsl(0, 0%, 98%) 100%)',
    dark: 'linear-gradient(135deg, hsl(50, 42%, 25%) 0%, hsl(50, 42%, 15%) 100%)',
  },
  {
    key: 'blush',
    name: 'Blush',
    light: 'linear-gradient(135deg, hsl(350, 80%, 94%) 0%, hsl(0, 0%, 98%) 100%)',
    dark: 'linear-gradient(135deg, hsl(350, 42%, 25%) 0%, hsl(350, 42%, 15%) 100%)',
  },
];

/**
 * Gets the appropriate CSS background value for a given color key and theme.
 * @param key The color key (e.g., 'mint', 'sky').
 * @param theme The current theme ('light' or 'dark').
 * @returns The CSS linear-gradient string or null if no key is provided.
 */
export const getKanbanColor = (key: string | null | undefined, theme: string | undefined): string | null => {
  if (!key) return null;
  const color = kanbanBoardColors.find(c => c.key === key);
  if (!color) return null; // Fallback for old, direct CSS values
  return theme === 'dark' ? color.dark : color.light;
};