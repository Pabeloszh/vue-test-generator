export class DataAnalyzer {
    #code

    constructor(code) {
        this.#code = code
    }

    #dataAnalyzerReducer(acc, curr) {
        acc[curr.key.name] = this.#dataTypeMap(curr.value)
        return acc;
    }
    #dataTypeMap(payload) {
        switch(payload.type){
            case 'ArrayExpression':
                return payload.elements?.map(el => this.#dataTypeMap(el))
            case 'BooleanLiteral':
                return payload.value
            case 'Identifier':
                return '/* external data */'
            case 'NullLiteral':
                return null
            case 'NumericLiteral':
                return payload.value
            case 'ObjectExpression':
                return payload.properties.reduce((acc, curr) => this.#dataAnalyzerReducer(acc, curr), {})
            case 'ObjectProperty':
                return payload
            case 'StringLiteral':
                return payload.value
            default: 
                return '/* unsupported case */'
        }
    }
    dataConditionMap(payload) {
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
    dataValueMap(payload) {
        switch(typeof payload) {
            case 'string':
                return `'${payload}'`
            case 'boolean': 
                return ''
            case 'object':
                return JSON.stringify(payload)
            default: 
                return payload
        }
    }
    analyzedCode() {
        return this.#code?.body?.properties?.reduce((acc, curr) => this.#dataAnalyzerReducer(acc, curr), {}) || {}
    }
}