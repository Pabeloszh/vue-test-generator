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
                return payload.elements?.map(el => dataTypeMap(el))
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
        switch(this.dataConditionMap(payload)) {
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
    analyzedCode() {
        return this.#code?.body?.properties?.reduce((acc, curr) => this.#dataAnalyzerReducer(acc, curr), {}) || {}
    }
}