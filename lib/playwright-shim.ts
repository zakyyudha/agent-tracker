export const chromium = {
  launch: async () => ({
    close: async () => {},
    newContext: async () => ({
      newPage: async () => ({
        goto: async () => {},
        setContent: async () => {},
        evaluate: async () => {},
        close: async () => {},
      }),
    }),
  }),
};
export default { chromium };
