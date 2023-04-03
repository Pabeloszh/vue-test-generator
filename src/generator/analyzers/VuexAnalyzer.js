export class VuexAnalyzer {
    constructor(payload) {
        this.code = payload.flatMap(({properties}) => properties)
    }

    #getVuexSpreadMethods() {
        return this.code.filter((el) => el?.type === 'SpreadElement')
    }

    #spreadMethodsReducer(acc, { argument }) {
        acc[this.#removeMapPhrase(argument.callee.name)] = 
            argument.arguments[0].elements.map(({name, value}) => { 
                if(argument.callee.name !== "mapGetters") return transformToCamelCase(name || value)
                else return name || value
            })

        return acc
    }

    #removeMapPhrase(payload) {
        return payload.replace(/map/gi, '').toLowerCase()
    }

    analyzedCode() {
        return this.#getVuexSpreadMethods()?.reduce((acc, curr) => this.#spreadMethodsReducer(acc, curr), {}) || []
    }
}
  
function transformToCamelCase(str) {
    const words = str.toLowerCase().split('_');
    const result = words.map((word, index) => {
      if (index === 0) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return result.join('');
}