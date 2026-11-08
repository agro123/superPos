import { readdirSync } from 'node:fs';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Features de `src/features`. Mantener sincronizado al crear una feature nueva. */
const FEATURES = [
  'auth',
  'business',
  'users',
  'catalog',
  'inventory',
  'sales',
  'cash',
  'customers',
  'reports',
  'settings',
  'terminals',
  'storefront',
  'setup',
  'restaurant',
  'platform',
];

const UI_LAYERS = ['ui', 'pages'];

const UI_ROOT = './src/shared/ui';
const ATOMIC_LEVELS = ['atoms', 'molecules', 'organisms', 'templates'];

/**
 * Atomic design: cada componente solo importa niveles inferiores, tokens y su propia carpeta.
 * Se genera por componente para que, p. ej., un átomo no pueda importar otro átomo.
 */
function atomicDesignZones() {
  return ATOMIC_LEVELS.flatMap((level, index) => {
    const lower = ATOMIC_LEVELS.slice(0, index).map((name) => `./${name}`);
    return readdirSync(`${UI_ROOT}/${level}`).map((component) => ({
      target: `${UI_ROOT}/${level}/${component}`,
      from: UI_ROOT,
      except: [...lower, `./${level}/${component}`, './tokens'],
      message: `Atomic design: ${level} solo importa niveles inferiores (docs/design-system/atomic-design.md).`,
    }));
  });
}

/**
 * Límites de arquitectura (docs/architecture/overview.md):
 * - domain no depende de nada fuera de domain.
 * - ui/pages no tocan infrastructure (pasan por application).
 * - una feature solo importa otra a través de su index.ts.
 * - shared no depende de features ni de app.
 * - atomic design: dependencias solo hacia abajo.
 */
const zones = [
  { target: './src/shared', from: './src/features', message: 'shared no depende de features.' },
  { target: './src/shared', from: './src/app', message: 'shared no depende de app.' },
  { target: './src/features', from: './src/app', message: 'features no depende de app.' },
  {
    target: './src/app',
    from: './src/features',
    except: FEATURES.map((feature) => `./${feature}/index.ts`),
    message: 'app importa cada feature solo a través de su index.ts.',
  },
  {
    target: './src/shared/domain',
    from: './src/shared',
    except: ['./domain'],
    message: 'shared/domain es TypeScript puro.',
  },
  {
    target: './src/shared/ui',
    from: './src/shared/infrastructure',
    message: 'El sistema de diseño es presentacional: sin acceso a datos.',
  },
  ...atomicDesignZones(),
  ...FEATURES.flatMap((feature) => {
    const base = `./src/features/${feature}`;
    const others = FEATURES.filter((f) => f !== feature);
    return [
      {
        target: base,
        from: './src/features',
        except: [`./${feature}`, ...others.map((o) => `./${o}/index.ts`)],
        message: 'Importa otras features solo a través de su index.ts.',
      },
      {
        target: `${base}/domain`,
        from: [base, './src/shared'],
        except: ['./domain'],
        message: 'domain es TypeScript puro: solo depende de domain.',
      },
      ...UI_LAYERS.map((layer) => ({
        target: `${base}/${layer}`,
        from: [`${base}/infrastructure`, './src/shared/infrastructure'],
        message: 'La UI accede a datos a través de application/.',
      })),
      {
        target: `${base}/application`,
        from: [`${base}/ui`, `${base}/pages`],
        message: 'application no depende de la UI.',
      },
      {
        target: `${base}/infrastructure`,
        from: [`${base}/application`, `${base}/ui`, `${base}/pages`],
        message: 'infrastructure solo implementa puertos de domain.',
      },
    ];
  }),
];

const FIREBASE_ONLY_IN_INFRA = {
  patterns: [
    {
      regex: '^@?firebase(/|$)',
      message: 'Solo infrastructure/ puede importar firebase (CLAUDE.md).',
    },
    {
      regex: '^electron(/|$)',
      message: 'La app es web estática (compatibilidad Tauri).',
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
      'functions',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: './tsconfig.app.json' }),
      ],
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // `onSubmit={form.handleSubmit(...)}` es el patrón de React Hook Form.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-invalid-void-type': ['error', { allowInGenericTypeArguments: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      'import-x/no-cycle': 'error',
      'import-x/no-duplicates': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'import-x/no-restricted-paths': ['error', { zones }],
      'import-x/no-nodejs-modules': 'error',
      'no-restricted-imports': ['error', FIREBASE_ONLY_IN_INFRA],
      'react/no-danger': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Prohibido dangerouslySetInnerHTML (docs/architecture/security.md).',
        },
        {
          selector: "MemberExpression[object.name='window'][property.name='require']",
          message: 'Sin window.require: la app debe ser web estática (Tauri).',
        },
      ],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/**/*.test.tsx'],
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/**/infrastructure/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [FIREBASE_ONLY_IN_INFRA.patterns[1]] }],
    },
  },
  {
    files: ['src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...FIREBASE_ONLY_IN_INFRA.patterns,
            { group: ['react', 'react-dom', 'react/*'], message: 'domain no usa React.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['scripts/**/*.ts', 'tests/**/*.ts', '*.config.{ts,js}', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
