export const PropsAnalyzer = (code) => {
  const propsTypeMapper = (payload) => {
    switch (payload.type) {
      case 'String':
      case 'Number':
        return 'toBe'
      case 'Boolean':
        if(payload.hasOwnProperty('default')) return payload.default ? 'toBeTruthy' : 'toBeFalsy'
        else return 'toBe'
      case 'Function':
        return 'toBe'
      case 'Object':
      case 'Array':
      case 'Symbol':
        return 'toStrictEqual'
      default:
        return 'toBe'
    }
  }
    
  const propsValueMapper = (payload) => {
      switch(payload.type){
        case 'Function':
          return "'function'"
        case 'Boolean':
          return ''
        default:
          return payload.hasOwnProperty('default') ? payload.default : '/* inherited from parent */'
      }
  }

  const optionalTypeOf = (payload) => {
    return payload.type === 'Function' ? 'typeof ' : ''
  }

  const analyzedCode = 
      code.properties.reduce((acc, {key, value}) => {
          const props = value.properties.reduce((propsAcc, prop) => {
            if (prop.key.name === 'type') {
              propsAcc.type = prop.value.name;
            } else if (prop.key.name === 'default' || prop.key.name === 'required') {
              propsAcc[prop.key.name] = prop.value.value;
            }
            return propsAcc;
          }, {});

          acc[key.name] = props;
          return acc;
      }, {})
  

  const generatedTests = 
      `test('Checks if all props values are correct', () => {
          ${Object.keys(analyzedCode).map(key => `expect(${optionalTypeOf(analyzedCode[key])}wrapper.props('${key}')).${propsTypeMapper(analyzedCode[key])}(${propsValueMapper(analyzedCode[key])})`).join('\n      ')}
      })`

  return {
      analyzedCode,
      generatedTests,
  }
}
