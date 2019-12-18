module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/typescript',
        'plugin:import/warnings',
        'plugin:@typescript-eslint/recommended',
    ],
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2019,
        project: './tsconfig.json',
        tsconfigRootDir: './',
    },
    overrides: [
        {
            files: ['*.js'],
            parser: 'babel-eslint',
            parserOptions: {},
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                'import/default': 'off',
                'import/named': 'off',
            },
        }
    ],
    plugins: [
        '@typescript-eslint',
        'import',
    ],
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            typescript: {
                directory: './tsconfig.json',
            },
        },
    },
    rules: {
        'array-bracket-spacing': ['error', 'always'],
        camelcase: ['error', { properties: 'always' }],
        'comma-dangle': ['error', 'always-multiline'],
        curly: ['error', 'all'],
        'max-depth': ['error', 4],
        'max-len': [
            'error',
            {
                code: 100,
                tabWidth: 4,
            },
        ],
        'max-lines': [
            'error',
            {
                max: 300,
                skipBlankLines: true,
                skipComments: true,
            },
        ],
        'max-statements-per-line': ['error', { max: 1 }],
        'newline-before-return': 'error',
        'no-else-return': 'error',
        'no-lonely-if': 'error',
        'no-restricted-imports': ['error', { patterns: ['..'] }],
        'no-return-await': 'error',
        'no-var': 'error',
        'object-shorthand': ['error', 'always'],
        'prefer-arrow-callback': 'error',
        'prefer-const': 'error',
        'prefer-template': 'error',
        'quotes': ['error', 'single'],
        'import/no-extraneous-dependencies': ['error'],
        'import/no-unresolved': 'error',
    },
};
