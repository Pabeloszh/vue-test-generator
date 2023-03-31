export const DataAnalyzer = (code) => {
    const dataReducer = (acc, prop) => {
        acc[prop.key.name] = dataTypeMap(prop.value)
        return acc;
    }
    
    const dataTypeMap = (node) => {
        switch(node.type){
            case 'ArrayExpression':
                return node.elements?.map(el => dataTypeMap(el))
            case 'BooleanLiteral':
                return node.value
            case 'Identifier':
                return '/* external data */'
            case 'NullLiteral':
                return null
            case 'NumericLiteral':
                return node.value
            case 'ObjectExpression':
                return node.properties.reduce(dataReducer, {})
            case 'ObjectProperty':
                return node
            case 'StringLiteral':
                return node.value
            default: 
                return '/* unsupported case */'
        }
    }

    const dataValueMap = (payload) => {
        switch(dataConditionMap(payload)) {
            case 'toBe':
                return payload
            case 'toBeTruthy':
            case 'toBeFalsy':
                return ''
            case 'toStrictEqual':
                return JSON.stringify(payload)
            default: 
                return ''
        }
    }
      
    const dataConditionMap = (payload) => {
        switch(typeof payload){
            case 'string':
            case 'number':
                return 'toBe'
            case 'boolean':
                return payload ? 'toBeTruthy' : 'toBeFalsy'
            case 'object':
                return payload === null ? 'toBe' : 'toStrictEqual'
            default: 
                return 'toBe'
        }
    }

    const analyzedCode = code.body.properties.reduce(dataReducer, {});

    const generatedTests = 
        `test('Checks if all data values are correct', () => {
            ${Object.keys(analyzedCode)
              .map((key) => 
                `expect(wrapper.vm.$data.${key}).${dataConditionMap(analyzedCode[key])}(${dataValueMap(analyzedCode[key])})`).join('\n      ')
            }
          })`

    return {
        analyzedCode,
        generatedTests,
    }
}