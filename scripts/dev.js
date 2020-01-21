/*
Run Rollup in watch mode for development.

To specific the package to watch, simply pass its name and the desired build
formats to watch (defaults to "global"):

```
# name supports fuzzy match. will watch all packages with name containing "dom"
yarn dev dom

# specify the format to output
yarn dev core --formats cjs

# Can also drop all __DEV__ blocks with:
__DEV__=false yarn dev
```
*/
/**
 * 开发环境打包文件
 */
const execa = require('execa')
const { fuzzyMatchTarget } = require('./utils')
const args = require('minimist')(process.argv.slice(2))
// 获取构建目标
const target = args._.length ? fuzzyMatchTarget(args._)[0] : 'vue'
// 获取format
const formats = args.formats || args.f
// 执行git操作,并截取输出
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)
// 开启进程调用rollup
execa(
  'rollup',
  [
    '-wc',
    '--environment',
    [
      `COMMIT:${commit}`,
      `TARGET:${target}`,
      `FORMATS:${formats || 'global'}`
    ].join(',')
  ],
  {
    stdio: 'inherit'
  }
)
