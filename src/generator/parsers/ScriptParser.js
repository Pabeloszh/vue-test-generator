import babel from '@babel/core'

export class ScriptParser {
  #script

  constructor(script) {
    this.#script = script.content
  }

  getSection(section) {
    const scriptCode = babel.transformSync(this.#script, {
      plugins: ['@babel/plugin-transform-typescript'],
    }).code
  
    const parsedScript = babel.parseSync(scriptCode, {
      plugins: ['@babel/plugin-syntax-object-rest-spread'],
    }).program.body

    return parsedScript
      .find((node) => node.type === 'ExportDefaultDeclaration')
      .declaration.arguments[0].properties.find(
        (node) => node.key.name === section
      )?.value || []
  }
}