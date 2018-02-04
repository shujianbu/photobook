module.exports = {
  "env": {
    "es6": true,
    "node": true
  },
  "extends": [
    'eslint:recommended',
    'plugin:vue/essential'
  ],
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 8,
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true
    }
  },
  "rules": {
    "no-console": 0
  }
};