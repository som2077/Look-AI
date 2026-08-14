// @ts-ignore: Deno import is not recognized by standard TS
import { readTextFileSync } from "https://deno.land/std@0.168.0/fs/mod.ts";

/**
 * Loads a prompt JSON file from the prompts directory.
 * @param name - The name of the prompt file (without .json extension)
 * @returns The parsed JSON object containing the prompt configuration
 */
export function loadPrompt(name: string): Record<string, unknown> {
  const path = new URL(`../prompts/${name}.json`, import.meta.url);
  const content = readTextFileSync(path);
  return JSON.parse(content);
}

/**
 * Renders a prompt template by replacing placeholders with provided values.
 * @param template - The template string containing placeholders like {image_url}
 * @param vars - An object mapping placeholder keys to their values
 * @returns The rendered template string with all placeholders replaced
 */
export function renderPrompt(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{${key}}`;
    result = result.split(placeholder).join(value);
  }
  return result;
}