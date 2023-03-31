import generate from "@babel/generator";

export const MethodsAnalyzer = (code) => {
    const methodNames = code.properties.map(({ key }) => key.name)

    const analyzedCode = code.properties.reduce((acc, curr) => {
        acc[curr.key.name] = {
        async: curr.async,
        params: curr.params,
        calls: generate
            .default(curr.body)
            .code.split('\n')
            .filter((line) => line.includes('this.') && !line.includes('$emit'))
            .map((line) => line.trim().split('this.')[1])
            .map((line) => line.substring(0, line.indexOf('(')))
            .filter((line) => methodNames.includes(line)),
        emits: generate
            .default(curr.body)
            .code.split('\n')
            .filter((line) => line.includes('this.') && line.includes('$emit'))
            .map((line) => line.match(/this\.\$emit\('(.+?)'/)[1]),
        }
        return acc
    }, {})

    const generatedTests = `${Object.keys(analyzedCode).map((key) =>  `test('Checks if ${key} method calls proper functions', async () => {
        ${analyzedCode[key].calls.map(call => `expect(${call}).not.toBeCalled()`).join('\n    ')}
        ${analyzedCode[key].emits.map(emit => `expect(wrapper.emitted('${emit}')).toBeFalsy()`).join('\n    ')}

        await wrapper.vm.${key}(${analyzedCode[key].params.length ? '/* add payload */' : ''})
  
        ${analyzedCode[key].calls.map(call => `expect(${call}).${analyzedCode[call]?.params.length ? 'toBeCalledWith' : 'toBeCalled'}(${analyzedCode[call]?.params.length ? '/* add payload */' : ''})`).join('\n    ')}
        ${analyzedCode[key].emits.map(emit => `expect(wrapper.emitted('${emit}')).toBeTruthy()`).join('\n    ')}
      })`).join('\n    ')}`

    return {
        analyzedCode,
        generatedTests,
    }
}
  