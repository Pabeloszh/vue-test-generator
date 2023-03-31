import generate from '@babel/generator'

export const ComputedAnalyzer = (code, props, data) => {
  const replaceInComputed = (data, keywords, replacable) => {
    return Object.keys(data).reduce((acc, key) => {
      let value = data[key]
      keywords.forEach((k) => {
        const regex = new RegExp(`this\.${k}(\.|$)`, 'g')
        value = value?.replace(regex, `${replacable}.${k}$1`)
      })
      acc[key] = value
      return acc
    }, {})
  }

  let analyzedCode = code.properties.reduce((acc, { type, key, body }) => {
    if (type !== 'SpreadElement') {
      // checking if is not getter
      acc[key.name] = generate.default(body).code.split(/return\s+/)[1]
    }
    return acc
  }, {})
  analyzedCode = replaceInComputed(
    analyzedCode,
    Object.keys(props),
    'wrapper.props()'
  )
  analyzedCode = replaceInComputed(
    analyzedCode,
    Object.keys(data),
    'wrapper.vm.$data'
  )

  const generatedTests = `${Object.keys(analyzedCode)
    .map(
      (key) => `test('Checks if ${key} computed returns proper value', () => {
        expect(wrapper.vm.${key}).toBe(\n        ${
        analyzedCode[key]?.replace(/(\r\n|\n|\r)/gm, '').slice(0, -2) || ''
      }) /* make sure it's correct */
      })`
    )
    .join('\n    ')}`
  return {
    analyzedCode,
    generatedTests,
  }
}
