module.exports = function resolveTokens(config, context) {
  const resolved = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      resolved[key] = value.replace(/{{(.*?)}}/g, (_, token) => {
        const parts = token.trim().split('.');
        let current = context;
        for (const part of parts) {
          if (current?.[part] !== undefined) {
            current = current[part];
          } else {
            return ''; // fallback if token not found
          }
        }
        return current;
      });
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
};
