export const camelToUpperCase = (payload) => payload.replace(/[A-Z]/g, match => `_${match}`).toUpperCase()

export const kebabToCamelCase = (payload) => payload.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

export const kebabToPascalCase = (payload) => payload.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');