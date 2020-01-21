import postcss, { Root } from 'postcss'

export default postcss.plugin('trim', () => (css: Root) => {
  css.walk(({ type, raws }: Record<string, any>) => {
    if (type === 'rule' || type === 'atrule') {
      if (raws.before) raws.before = '\n'
      if (raws.after) raws.after = '\n'
    }
  })
})
