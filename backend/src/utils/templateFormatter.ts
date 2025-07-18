/**
 * Formats a template string by replacing placeholders with actual values
 * 
 * @param template The template string with placeholders in the format {{placeholder}}
 * @param data An object containing the values to replace the placeholders
 * @returns The formatted string
 */
export function formatTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = data[key.trim()];
    return value !== undefined ? value : match;
  });
}