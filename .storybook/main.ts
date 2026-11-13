import type { StorybookConfig } from '@storybook/react-vite'
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  addons: [
    { name: '@zigbang/storybook-addon-story-flow', options: { flowGlob: '../src/**/*.flow.json' } },
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
}
export default config
