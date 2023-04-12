export class PropsAnalyzer {
  #code

  constructor(code) {
    this.#code = code
  }

  propsTypeMap(payload) {
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

  propsValueMap(payload) {
    switch(payload.type){
      case 'Function':
        return "'function'"
      case 'Boolean':
        return ''
      case 'String':
        return `'${payload.default}'`
      default:
        return payload.hasOwnProperty('default') ? payload.default : '/* inherited from parent */'
    }
  }
  
  optionalTypeOf(payload) {
    return payload.type === 'Function' ? 'typeof ' : ''
  }
  
  analyzedCode() {
    return this.#code?.properties?.reduce((acc, {key, value}) => {
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
    }, {}) || {}
  }
}