import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  // 示例模式
  if (mode === 'example') {
    return {
      plugins: [vue()],
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src')
        }
      },
      build: {
        outDir: 'dist-example'
      },
      server: {
        port: 5178
      }
    }
  }

  // gh-pages 部署模式 - 构建静态站点
  if (mode === 'gh-pages') {
    return {
      root: './',
      plugins: [vue()],
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src')
        }
      },
      build: {
        outDir: '../dist-gh-pages'
      },
      base: '/ai-stream-scroll/'
    }
  }

  // 默认构建配置
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: {
      outDir: 'dist',
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AiStreamScroll',
        formats: ['es', 'cjs', 'umd'],
        fileName: (format) => `ai-stream-scroll.${format}.js`
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue'
          }
        }
      }
    }
  }
})
