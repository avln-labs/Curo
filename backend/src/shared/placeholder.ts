/**
 * Shared placeholder service — returns a standard "not implemented" response.
 * Replace each method with real DB calls when the database is connected.
 */
export const createPlaceholderService = (module: string) => ({
  async placeholder() {
    return { success: true, module, status: 'scaffold', message: `${module} endpoint is a placeholder — coming soon.` };
  },
});
