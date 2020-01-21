import { expectError, expectType } from 'tsd'
import { describe, createComponent, PropType, ref } from './index'

describe('with object props', () => {
  interface ExpectedProps {
    a?: number | undefined
    b: string
    bb: string
    cc?: string[] | undefined
    dd: string[]
    ccc?: string[] | undefined
    ddd: string[]
  }

  const MyComponent = createComponent({
    props: {
      a: Number,
      // required should make property non-void
      b: {
        type: String,
        required: true
      },
      // default value should infer type and make it non-void
      bb: {
        default: 'hello'
      },
      // explicit type casting
      cc: Array as PropType<string[]>,
      // required + type casting
      dd: {
        type: Array as PropType<string[]>,
        required: true
      },
      // explicit type casting with constructor
      ccc: Array as () => string[],
      // required + contructor type casting
      ddd: {
        type: Array as () => string[],
        required: true
      }
    },
    setup(props) {
      // type assertion. See https://github.com/SamVerschueren/tsd
      expectType<ExpectedProps['a']>(props.a)
      expectType<ExpectedProps['b']>(props.b)
      expectType<ExpectedProps['bb']>(props.bb)
      expectType<ExpectedProps['cc']>(props.cc)
      expectType<ExpectedProps['dd']>(props.dd)
      expectType<ExpectedProps['ccc']>(props.ccc)
      expectType<ExpectedProps['ddd']>(props.ddd)

      // props should be readonly
      expectError((props.a = 1))

      // setup context
      return {
        c: ref(1),
        d: {
          e: ref('hi')
        }
      }
    },
    render() {
      const props = this.$props
      expectType<ExpectedProps['a']>(props.a)
      expectType<ExpectedProps['b']>(props.b)
      expectType<ExpectedProps['bb']>(props.bb)
      expectType<ExpectedProps['cc']>(props.cc)
      expectType<ExpectedProps['dd']>(props.dd)
      expectType<ExpectedProps['ccc']>(props.ccc)
      expectType<ExpectedProps['ddd']>(props.ddd)

      // props should be readonly
      expectError((props.a = 1))

      // should also expose declared props on `this`
      expectType<ExpectedProps['a']>(this.a)
      expectType<ExpectedProps['b']>(this.b)
      expectType<ExpectedProps['bb']>(this.bb)
      expectType<ExpectedProps['cc']>(this.cc)
      expectType<ExpectedProps['dd']>(this.dd)
      expectType<ExpectedProps['ccc']>(this.ccc)
      expectType<ExpectedProps['ddd']>(this.ddd)

      // props on `this` should be readonly
      expectError((this.a = 1))

      // assert setup context unwrapping
      expectType<number>(this.c)
      expectType<string>(this.d.e)

      // setup context properties should be mutable
      this.c = 2

      return null
    }
  })

  // Test TSX
  expectType<JSX.Element>(
    <MyComponent
      a={1}
      b="b"
      bb="bb"
      cc={['cc']}
      dd={['dd']}
      ccc={['ccc']}
      ddd={['ddd']}
      // should allow extraneous as attrs
      class="bar"
      // should allow key
      key={'foo'}
      // should allow ref
      ref={'foo'}
    />
  )

  // missing required props
  expectError(<MyComponent />)

  // wrong prop types
  expectError(
    <MyComponent a={'wrong type'} b="foo" dd={['foo']} ddd={['foo']} />
  )
  expectError(<MyComponent b="foo" dd={[123]} ddd={['foo']} />)
})

describe('type inference w/ optional props declaration', () => {
  const MyComponent = createComponent({
    setup(_props: { msg: string }) {
      return {
        a: 1
      }
    },
    render() {
      expectType<string>(this.$props.msg)
      // props should be readonly
      expectError((this.$props.msg = 'foo'))
      // should not expose on `this`
      expectError(this.msg)
      expectType<number>(this.a)
      return null
    }
  })

  expectType<JSX.Element>(<MyComponent msg="foo" />)
  expectError(<MyComponent />)
  expectError(<MyComponent msg={1} />)
})

describe('type inference w/ direct setup function', () => {
  const MyComponent = createComponent((_props: { msg: string }) => {})
  expectType<JSX.Element>(<MyComponent msg="foo" />)
  expectError(<MyComponent />)
  expectError(<MyComponent msg={1} />)
})

describe('type inference w/ array props declaration', () => {
  createComponent({
    props: ['a', 'b'],
    setup(props) {
      // props should be readonly
      expectError((props.a = 1))
      expectType<any>(props.a)
      expectType<any>(props.b)
      return {
        c: 1
      }
    },
    render() {
      expectType<any>(this.$props.a)
      expectType<any>(this.$props.b)
      expectError((this.$props.a = 1))
      expectType<any>(this.a)
      expectType<any>(this.b)
      expectType<number>(this.c)
    }
  })
})

describe('type inference w/ options API', () => {
  createComponent({
    props: { a: Number },
    setup() {
      return {
        b: 123
      }
    },
    data() {
      // Limitation: we cannot expose the return result of setup() on `this`
      // here in data() - somehow that would mess up the inference
      expectType<number | undefined>(this.a)
      return {
        c: this.a || 123
      }
    },
    computed: {
      d(): number {
        expectType<number>(this.b)
        return this.b + 1
      }
    },
    watch: {
      a() {
        expectType<number>(this.b)
        this.b + 1
      }
    },
    created() {
      // props
      expectType<number | undefined>(this.a)
      // returned from setup()
      expectType<number>(this.b)
      // returned from data()
      expectType<number>(this.c)
      // computed
      expectType<number>(this.d)
    },
    methods: {
      doSomething() {
        // props
        expectType<number | undefined>(this.a)
        // returned from setup()
        expectType<number>(this.b)
        // returned from data()
        expectType<number>(this.c)
        // computed
        expectType<number>(this.d)
      }
    },
    render() {
      // props
      expectType<number | undefined>(this.a)
      // returned from setup()
      expectType<number>(this.b)
      // returned from data()
      expectType<number>(this.c)
      // computed
      expectType<number>(this.d)
    }
  })
})
