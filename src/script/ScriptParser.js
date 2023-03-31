import babel from '@babel/core'

export const ScriptParser = (script) => {
  const scriptCode = babel.transformSync(script.content, {
    plugins: ['@babel/plugin-transform-typescript'],
  }).code

  const parsedScript = babel.parseSync(scriptCode, {
    plugins: ['@babel/plugin-syntax-object-rest-spread'],
  }).program.body

  const getSection = (section) => {
    return (
      parsedScript
        .find((node) => node.type === 'ExportDefaultDeclaration')
        .declaration.arguments[0].properties.find(
          (node) => node.key.name === section
        )?.value || []
    )
  }
  return {
    parsedScript,
    getSection,
  }
}
