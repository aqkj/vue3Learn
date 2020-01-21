/**
 * webpack配置
 * @author xiaoqiang <465633678@qq.com>
 * @created 2019/10/21 17:18:30
 */
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const lernaJson = require('../lerna.json')
module.exports = function(env, args) {
  const isDev = env === 'development'
  const config = {
    mode: env,
    entry: {
      app: './index.ts'
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      filename:
        env === 'production' ? '[name].[chunkhash:8].js' : '[name].[hash:8].js',
      chunkFilename: '[name].[chunkhash:8].js'
    },
    module: {
      unknownContextCritical: false,
      rules: [
        {
          test: /.ts$/,
          use: ['ts-loader']
        }
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vue: {
            name: 'vue',
            chunks: 'all',
            minSize: 0,
            test: /[\\/]packages[\\/]/
          }
        }
      }
    },
    resolve: {
      alias: {
        zqvue: path.resolve(__dirname, '../packages/vue/src/index.ts'),
        '@vue/shared': path.resolve(
          __dirname,
          '../packages/shared/src/index.ts'
        ),
        '@vue/runtime-core': path.resolve(
          __dirname,
          '../packages/runtime-core/src/index.ts'
        ),
        '@vue/runtime-dom': path.resolve(
          __dirname,
          '../packages/runtime-dom/src/index.ts'
        ),
        '@vue/runtime-test': path.resolve(
          __dirname,
          '../packages/runtime-test/src/index.ts'
        ),
        '@vue/reactivity': path.resolve(
          __dirname,
          '../packages/reactivity/src/index.ts'
        ),
        '@vue/compiler-core': path.resolve(
          __dirname,
          '../packages/compiler-core/src/index.ts'
        ),
        '@vue/compiler-dom': path.resolve(
          __dirname,
          '../packages/compiler-dom/src/index.ts'
        ),
        '@vue/server-renderer': path.resolve(
          __dirname,
          '../packages/server-renderer/src/index.ts'
        ),
        '@vue/template-explorer': path.resolve(
          __dirname,
          '../packages/template-explorer/src/index.ts'
        )
      },
      extensions: ['.json', '.ts', '.js']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './index.html'),
        filename: 'index.html'
      }),
      new webpack.DefinePlugin({
        __DEV__: isDev,
        __VERSION__: `"${lernaJson.version}"`,
        __BROWSER__: true,
        __JSDOM__: !isDev,
        __RUNTIME_COMPILE__: isDev,
        __FEATURE_OPTIONS__: isDev,
        __FEATURE_SUSPENSE__: isDev,
        __TEST__: false
      })
    ]
  }
  return config
}
