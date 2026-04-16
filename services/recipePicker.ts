// In-memory callback store for the recipe picker screen.
// The planner registers a callback, navigates to /recipe/pick,
// and the picker calls completePick() before going back.

type PickCallback = (recipeId: string, portions: number) => void;

let _callback: PickCallback | null = null;

export function registerPickCallback(cb: PickCallback): void {
  _callback = cb;
}

export function completePick(recipeId: string, portions: number): void {
  _callback?.(recipeId, portions);
  _callback = null;
}

export function cancelPick(): void {
  _callback = null;
}
