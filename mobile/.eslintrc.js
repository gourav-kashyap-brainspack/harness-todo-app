module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['boundaries'],
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
    // Feature-sliced element types (conventions.md). Default mode is
    // "folder": each pattern auto-extends to `<pattern>/**/*`, so every file
    // nested under the folder is classified.
    'boundaries/elements': [
      {type: 'app', pattern: 'src/app'},
      {type: 'feature', pattern: 'src/features/*', capture: ['feature']},
      {type: 'core', pattern: 'src/core'},
      {type: 'components', pattern: 'src/components'},
      {type: 'theme', pattern: 'src/theme'},
      {type: 'platform', pattern: 'src/platform'},
    ],
  },
  rules: {
    // Layer direction: app -> features -> core|components|theme|platform.
    // No cross-feature imports (same-feature siblings are allowed via the
    // captured `feature` value). Anything not explicitly allowed is an
    // error (default: "disallow"), matching the --max-warnings=0 gate.
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        policies: [
          {
            from: {element: {types: 'app'}},
            allow: {
              to: {
                element: {
                  types: ['app', 'feature', 'core', 'components', 'theme', 'platform'],
                },
              },
            },
          },
          {
            from: {element: {types: 'feature'}},
            allow: {
              to: [
                {
                  element: {
                    types: 'feature',
                    captured: {feature: '{{from.element.captured.feature}}'},
                  },
                },
                {element: {types: ['core', 'components', 'theme', 'platform']}},
              ],
            },
          },
          {
            from: {element: {types: ['core', 'components', 'theme', 'platform']}},
            allow: {
              to: {element: {types: ['core', 'components', 'theme', 'platform']}},
            },
          },
        ],
      },
    ],
  },
};
