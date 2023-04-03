import generate from "@babel/generator";

export class MethodsAnalyzer {
    #code

    constructor(code) {
        this.#code = code || []
    }

    #methodsWithoutVuex() {
        return this.#code?.properties?.filter(({ type }) => type !== 'SpreadElement') || []
    }

    #methodNames() {
        return this.#methodsWithoutVuex().map(({ key }) => key.name)
    }

    #extractFunctionCalls(payload) {
        return payload
            .filter((line) => line.includes('this.') && !line.includes('$emit'))
            .map((line) => line.trim().split('this.')[1])
            .map((line) => line.substring(0, line.indexOf('(')))
            .filter((line) => this.#methodNames().includes(line))
    }

    #extractEmits(payload) {
        return payload
            .filter((line) => line.includes('this.') && line.includes('$emit'))
            .map((line) => line.match(/this\.\$emit\('(.+?)'/)[1])
    }

    analyzedCode() {
        return this.#methodsWithoutVuex().reduce((acc, curr) => {
            const splittedCode = generate
                .default(curr.body)
                .code.split('\n')

            acc[curr.key.name] = {
                async: curr.async,
                params: curr.params,
                calls: this.#extractFunctionCalls(splittedCode),
                emits: this.#extractEmits(splittedCode)
            }
            return acc
        }, {})
    }


}