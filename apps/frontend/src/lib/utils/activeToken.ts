export type ActiveToken = {
  trigger: '@' | '#';
  query: string;
  start: number;
  end: number;
};

// Characters that can appear in a mention or hashtag after the trigger.
const TOKEN_CHAR_RE = /[A-Za-z0-9._]/;

/**
 * Given a text value and the current caret position, returns the active
 * @mention or #hashtag token the caret is within, or null if none.
 *
 * `start` is the index of the trigger character, `end` is the caret position.
 */
export function activeToken(value: string, caret: number): ActiveToken | null {
  // Scan left over token characters.
  let i = caret - 1;
  while (i >= 0 && TOKEN_CHAR_RE.test(value.charAt(i))) {
    i--;
  }

  // The character immediately before the run must be @ or #.
  const triggerChar = value.charAt(i);
  if (triggerChar !== '@' && triggerChar !== '#') return null;

  const triggerIndex = i;
  const trigger = triggerChar;

  // The trigger must be at the start of the string or preceded by whitespace.
  if (triggerIndex > 0 && !/\s/.test(value.charAt(triggerIndex - 1))) return null;

  return {
    trigger,
    query: value.slice(triggerIndex + 1, caret),
    start: triggerIndex,
    end: caret
  };
}
