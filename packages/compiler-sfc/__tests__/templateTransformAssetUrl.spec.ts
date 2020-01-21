import { generate, parse, transform } from '@vue/compiler-core'
import { transformAssetUrl } from '../src/templateTransformAssetUrl'
import { transformElement } from '../../compiler-core/src/transforms/transformElement'
import { transformBind } from '../../compiler-core/src/transforms/vBind'

function compileWithAssetUrls(template: string) {
  const ast = parse(template)
  transform(ast, {
    nodeTransforms: [transformAssetUrl, transformElement],
    directiveTransforms: {
      bind: transformBind
    }
  })
  return generate(ast, { mode: 'module' })
}

describe('compiler sfc: transform asset url', () => {
  test('transform assetUrls', () => {
    const result = compileWithAssetUrls(`
			<img src="./logo.png"/>
			<img src="~fixtures/logo.png"/>
			<img src="~/fixtures/logo.png"/>
		`)

    expect(result.code).toMatchSnapshot()
  })

  /**
   * vuejs/component-compiler-utils#22 Support uri fragment in transformed require
   */
  test('support uri fragment', () => {
    const result = compileWithAssetUrls(
      '<use href="~@svg/file.svg#fragment"></use>'
    )

    expect(result.code).toMatchSnapshot()
  })

  /**
   * vuejs/component-compiler-utils#22 Support uri fragment in transformed require
   */
  test('support uri is empty', () => {
    const result = compileWithAssetUrls('<use href="~"></use>')

    expect(result.code).toMatchSnapshot()
  })
})
