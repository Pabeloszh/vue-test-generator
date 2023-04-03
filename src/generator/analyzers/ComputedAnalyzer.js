import generate from '@babel/generator'

export class ComputedAnalyzer {
  #code
  #propsAnalyzedCode
  #dataAnalyzedCode

  constructor(code, propsAnalyzedCode, dataAnalyzedCode) {
    this.#code = code || []
    this.#propsAnalyzedCode = propsAnalyzedCode
    this.#dataAnalyzedCode = dataAnalyzedCode
  }

  #replaceThisPhrase(data, keywords, replacable) {
    return Object.keys(data)?.reduce((acc, key) => {
      let value = data[key]
      keywords.forEach((k) => {
        const regex = new RegExp(`this\.${k}(\.|$)`, 'g')
        value = value?.replace(regex, `${replacable}.${k}$1`)
      })
      acc[key] = value
      return acc
    }, {})
  }

  removeBracketsFromReturnString(payload) {
    return `/* possible expected value: ${payload?.replace(/(\r\n|\n|\r)/gm, '').slice(0, -2)} */` || ''
  } 

  analyzedCode() {
    let computedMethods = this.#code?.properties?.reduce((acc, { type, key, body }) => {
      if (type !== 'SpreadElement') {
        acc[key.name] = generate.default(body).code.split(/return\s+/)[1]
      }
      return acc
    }, {}) || []

    computedMethods = this.#replaceThisPhrase(
      computedMethods,
      Object.keys(this.#propsAnalyzedCode),
      'wrapper.props()'
    )

    computedMethods = this.#replaceThisPhrase(
      computedMethods,
      Object.keys(this.#dataAnalyzedCode),
      'wrapper.vm.$data'
    )

    return computedMethods
  }
}