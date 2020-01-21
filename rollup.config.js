import fs from 'fs'
import path from 'path'
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'
import alias from '@rollup/plugin-alias'
import json from '@rollup/plugin-json'
import lernaJson from './lerna.json'
// 判断是否存在target目标
if (!process.env.TARGET) {
  throw new Error('TARGET package must be specified via --environment flag.')
}
// 获取包文件夹
const packagesDir = path.resolve(__dirname, 'packages')
// 获取对应target的包文件
const packageDir = path.resolve(packagesDir, process.env.TARGET)
// 获取包target包的名称
const name = path.basename(packageDir)
// 解析对应包内的文件夹名称
const resolve = p => path.resolve(packageDir, p)
// 引入项目下的package.json包信息文件
const pkg = require(resolve(`package.json`))
// 获取包的打包配置
const packageOptions = pkg.buildOptions || {}

// build aliases dynamically
// 配置别名
const aliasOptions = { resolve: ['.ts'] }
// 获取packages文件夹下的文件列表数组，并且遍历
fs.readdirSync(packagesDir).forEach(dir => {
  // 如果文件夹名称为vue
  if (dir === 'vue') {
    // 跳过
    return
  }
  // 解析对应文件夹，并且判断类型是否为文件夹
  if (fs.statSync(path.resolve(packagesDir, dir)).isDirectory()) {
    // 解析src/index绝对路径并设置到别名配置内
    aliasOptions[`@vue/${dir}`] = path.resolve(packagesDir, `${dir}/src/index`)
  }
})
// 调用别名插件
const aliasPlugin = alias(aliasOptions)

// ensure TS checks only once for each build
let hasTSChecked = false
// 生成文件配置
const configs = {
  // esmodule
  esm: {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: `es`
  },
  // commonjs
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: `cjs`
  },
  // iife
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: `iife`
  },
  // esmodule-browser
  'esm-browser': {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: `es`
  }
}
// 默认格式化
const defaultFormats = ['esm', 'cjs']
// 获取传递的format数组
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',')
// 获取包format数组
const packageFormats = inlineFormats || packageOptions.formats || defaultFormats
// 获取对应格式的数组配置
const packageConfigs = process.env.PROD_ONLY
  ? []
  : packageFormats.map(format => createConfig(configs[format]))

if (process.env.NODE_ENV === 'production') {
  packageFormats.forEach(format => {
    if (format === 'cjs' && packageOptions.prod !== false) {
      packageConfigs.push(createProductionConfig(format))
    }
    if (format === 'global' || format === 'esm-browser') {
      packageConfigs.push(createMinifiedConfig(format))
    }
  })
}

export default packageConfigs
/**
 * 创建配置
 * @param {object} output 导出配置
 * @param {any[]} plugins 插件数组
 */
function createConfig(output, plugins = []) {
  // 关闭生成代码支持外部导入
  output.externalLiveBindings = false
  // 判断是为生成环境打包
  const isProductionBuild =
    process.env.__DEV__ === 'false' || /\.prod\.js$/.test(output.file)
  // 判断是否为global环境打包
  const isGlobalBuild = /\.global(\.prod)?\.js$/.test(output.file)
  // 判断是否 为esmodule模式打包
  const isBundlerESMBuild = /\.esm-bundler\.js$/.test(output.file)
  // 判断是否为浏览器环境的esmodule打包
  const isBrowserESMBuild = /esm-browser(\.prod)?\.js$/.test(output.file)
  // 判断是否为运行时编译打包
  const isRuntimeCompileBuild = /vue\./.test(output.file)
  // 如果是global模式打包
  if (isGlobalBuild) {
    // 设置打出名称
    output.name = packageOptions.name
  }
  // 是否生成声明文件
  const shouldEmitDeclarations =
    process.env.TYPES != null &&
    process.env.NODE_ENV === 'production' &&
    !hasTSChecked
  // typescript插件
  const tsPlugin = ts({
    check: process.env.NODE_ENV === 'production' && !hasTSChecked,
    // ts配置文件
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    // 缓存路径
    cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
    // ts配置重写
    tsconfigOverride: {
      compilerOptions: {
        declaration: shouldEmitDeclarations,
        declarationMap: shouldEmitDeclarations
      },
      // exclude
      exclude: ['**/__tests__', 'test-dts']
    }
  })
  // we only need to check TS and generate declarations once for each build.
  // it also seems to run into weird issues when checking multiple times
  // during a single build.
  hasTSChecked = true
  // 外部依赖
  const externals = Object.keys(aliasOptions)
    .concat(Object.keys(pkg.dependencies || []))
    .filter(p => p !== '@vue/shared')

  return {
    input: resolve(`src/index.ts`),
    // Global and Browser ESM builds inlines everything so that they can be
    // used alone.
    external: isGlobalBuild || isBrowserESMBuild ? [] : externals,
    plugins: [
      json({
        namedExports: false
      }),
      tsPlugin,
      aliasPlugin,
      createReplacePlugin(
        isProductionBuild,
        isBundlerESMBuild,
        (isGlobalBuild || isBrowserESMBuild) &&
          !packageOptions.enableNonBrowserBranches,
        isRuntimeCompileBuild
      ),
      ...plugins
    ],
    output,
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg)
      }
    }
  }
}

function createReplacePlugin(
  isProduction,
  isBundlerESMBuild,
  isBrowserBuild,
  isRuntimeCompileBuild
) {
  return replace({
    __COMMIT__: `"${process.env.COMMIT}"`,
    __VERSION__: `"${lernaJson.version}"`,
    __DEV__: isBundlerESMBuild
      ? // preserve to be handled by bundlers
        `(process.env.NODE_ENV !== 'production')`
      : // hard coded dev/prod builds
        !isProduction,
    // this is only used during tests
    __TEST__: isBundlerESMBuild ? `(process.env.NODE_ENV === 'test')` : false,
    // If the build is expected to run directly in the browser (global / esm-browser builds)
    __BROWSER__: isBrowserBuild,
    // support compile in browser?
    __RUNTIME_COMPILE__: isRuntimeCompileBuild,
    // support options?
    // the lean build drops options related code with buildOptions.lean: true
    __FEATURE_OPTIONS__: !packageOptions.lean && !process.env.LEAN,
    __FEATURE_SUSPENSE__: true
  })
}

function createProductionConfig(format) {
  return createConfig({
    file: resolve(`dist/${name}.${format}.prod.js`),
    format: configs[format].format
  })
}

function createMinifiedConfig(format) {
  const { terser } = require('rollup-plugin-terser')
  return createConfig(
    {
      file: resolve(`dist/${name}.${format}.prod.js`),
      format: configs[format].format
    },
    [
      terser({
        module: /^esm/.test(format)
      })
    ]
  )
}
