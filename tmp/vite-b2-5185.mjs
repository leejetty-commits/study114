import { defineConfig, mergeConfig } from 'file:///D:/work/study114/preview/home-ui/node_modules/vite/dist/node/index.js';
import baseConfig from 'file:///D:/work/study114/.wt/home-b2/preview/home-ui/vite.config.js';

const home = 'D:/work/study114/.wt/home-b2/preview/home-ui';

export default defineConfig(async (env) => {
  const base = typeof baseConfig === 'function' ? await baseConfig(env) : baseConfig;
  return mergeConfig(base, {
    root: home,
    cacheDir: 'D:/work/study114/tmp/vite-cache-b2',
    server: { port: 5185, strictPort: true, host: '127.0.0.1' },
  });
});
