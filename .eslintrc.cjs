module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier'
    ],
    settings: {
        react: { version: 'detect' },
        'import/resolver': { typescript: true }
    },
    rules: {
        'react/react-in-jsx-scope': 'off',
        'import/no-unresolved': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
    }
}