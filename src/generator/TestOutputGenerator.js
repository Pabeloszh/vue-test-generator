import path from 'path';
import { VuexAnalyzer } from "./analyzers/VuexAnalyzer.js"
import { PropsAnalyzer } from "./analyzers/PropsAnalyzer.js"
import { DataAnalyzer } from "./analyzers/DataAnalyzer.js"
import { ComputedAnalyzer } from "./analyzers/ComputedAnalyzer.js"
import { MethodsAnalyzer } from './analyzers/MethodsAnalyzer.js';
import { TemplateAnalyzer } from './analyzers/TemplateAnalyzer.js';
import { ScriptParser } from "./parsers/ScriptParser.js"
import { findComponentInDirectory } from "../utils/findComponentInDirectory.js"
import { extractRepoDirectory } from "../utils/extractRepoDirectory.js"
import { kebabToPascalCase, kebabToCamelCase, camelToUpperCase } from "../utils/transformNamingConvention.js"

export class TestOutputGenerator {
    #filePath
    #fileName
    #scriptParser
    #vuexAnalyzedCode
    #propsAnalyzer
    #propsAnalyzedCode
    #dataAnalyzer
    #dataAnalyzedCode
    #computedAnalyzer
    #computedAnalyzedCode
    #methodsAnalyzer
    #methodsAnalyzedCode
    #templateAnalyzedCode

    constructor(filePath, script, content) {
        this.#filePath = filePath
        this.#fileName = path.parse(filePath).name
        this.#scriptParser = new ScriptParser(script)
        this.#vuexAnalyzedCode = new VuexAnalyzer([this.#scriptParser.getSection('computed'), this.#scriptParser.getSection('methods')]).analyzedCode()
        this.#propsAnalyzer = new PropsAnalyzer(this.#scriptParser.getSection('props'))
        this.#propsAnalyzedCode = this.#propsAnalyzer.analyzedCode()
        this.#dataAnalyzer = new DataAnalyzer(this.#scriptParser.getSection('data'))
        this.#dataAnalyzedCode = this.#dataAnalyzer.analyzedCode()
        this.#computedAnalyzer = new ComputedAnalyzer(this.#scriptParser.getSection('computed'), this.#propsAnalyzedCode, this.#dataAnalyzedCode)
        this.#computedAnalyzedCode = this.#computedAnalyzer.analyzedCode()
        this.#methodsAnalyzer = new MethodsAnalyzer(this.#scriptParser.getSection('methods'))
        this.#methodsAnalyzedCode = this.#methodsAnalyzer.analyzedCode()
        this.#templateAnalyzedCode = new TemplateAnalyzer(content).analyzedCode()
    }

    #hasAnyVuexMethods() {
        return Object.keys(this.#vuexAnalyzedCode).length
    }

    #testSectionImports() {
        return `
            import { shallowMount ${this.#hasAnyVuexMethods() ? ', createLocalVue' : ''} } from '@vue/test-utils'
            ${this.#hasAnyVuexMethods() ? "import Vuex, { Store } from 'vuex'" : ''}
            import ${this.#fileName} from '${findComponentInDirectory(`${extractRepoDirectory(this.#filePath)}/components`, `${this.#fileName}.vue`)}'
            ${this.#componentsImports()}
        `
    }

    #componentsImports() {
        const hasAnyComponent = Object.keys(this.#templateAnalyzedCode).length
        return hasAnyComponent ? 
            `${Object.keys(this.#templateAnalyzedCode).map(key => `import ${kebabToPascalCase(key)} from '${findComponentInDirectory(`${extractRepoDirectory(this.#filePath)}/components`, `${kebabToPascalCase(key)}.vue`)}'`).join('\n')}`
            : ``
    }

    #testSectionDeclaringVariables() {
        return `
            ${this.#hasAnyVuexMethods() ? this.#storeDeclaration() : ''}
            let wrapper: any
            ${this.#spyOnDeclarations()}
        `
    }

    #storeDeclaration() {
        return `
            const localVue = createLocalVue()

            localVue.use(Vuex)
        
            const store = new Store({
                ${
                    Object.keys(this.#vuexAnalyzedCode).map(key => `${key}, /* add mock data */ `).join('\n')
                }
            })


        `
    }

    #spyOnDeclarations() {        
        return this.#allSpyedFunctions().length ? `${this.#allSpyedFunctions().map(key => `let ${key}: jest.SpyInstance`).join('\n')}` : ``
    }

    #allSpyedFunctions() {
        const methodsNames = Object.keys(this.#methodsAnalyzedCode)
        const vuexActionAndMutationNames = Object.keys(this.#vuexAnalyzedCode).reduce((acc, curr) => {
            if(curr !== 'getters') {
                acc.push(...this.#vuexAnalyzedCode[curr])
            }
            return acc
        }, [])

        return [...methodsNames, ...vuexActionAndMutationNames]
    }

    #testSectionBeforeEach() {
        return `
            beforeEach(() => {
                wrapper = shallowMount(${this.#fileName}, {
                    ${this.#hasAnyVuexMethods() ? 'store,' : ''}${this.#componentsBeforeEachObject()}${this.#propsBeforeEachObject()}
                })
                ${this.#spyOnAssignmentBeforeEach()}
            })
        `
    }

    #componentsBeforeEachObject() {
        return `${this.#templateAnalyzedCode ? `components: {${Object.keys(this.#templateAnalyzedCode).map(key => kebabToPascalCase(key)).join(', ')}},` : ``}`
    }

    #propsBeforeEachObject() {
        const requiredProps = Object.keys(this.#propsAnalyzedCode).filter((key) => this.#propsAnalyzedCode[key].required)
        return `
            ${requiredProps.length 
                ? `propsData: {${requiredProps.map(key => `${key}: 'type ${this.#propsAnalyzedCode[key].type}' /* add mock data */`)}},` 
                : ``
            }
        `
    }

    #spyOnAssignmentBeforeEach() {
        return this.#allSpyedFunctions().length ? 
            `${this.#allSpyedFunctions().map(key => {
                const wrapperFunction = this.#vuexAnalyzedCode.mutations?.includes(key) ? camelToUpperCase(key) : key
                return `${key} = jest.spyOn(wrapper.vm, '${wrapperFunction}')`
            }).join('\n')}` : ``
    }

    #testSectionProps() {
        const hasAnyProps = Object.keys(this.#propsAnalyzedCode).length
        return hasAnyProps ? `
            it('Checks if all props values are correct', () => {
                ${Object.keys(this.#propsAnalyzedCode).map(key => `expect(${this.#propsAnalyzer.optionalTypeOf(this.#propsAnalyzedCode[key])}wrapper.props('${key}')).${this.#propsAnalyzer.propsTypeMap(this.#propsAnalyzedCode[key])}(${this.#propsAnalyzer.propsValueMap(this.#propsAnalyzedCode[key])})`).join('\n')}
            })
        ` : ``
    }

    #testSectionData() {
        const hasAnyData = Object.keys(this.#dataAnalyzedCode).length
        return hasAnyData ? `
            it('Checks if all data values are correct', () => {
                ${Object.keys(this.#dataAnalyzedCode)
                    .map((key) => 
                        `expect(wrapper.vm.$data.${key}).${this.#dataAnalyzer.dataConditionMap(this.#dataAnalyzedCode[key])}(${this.#dataAnalyzer.dataValueMap(this.#dataAnalyzedCode[key])})`).join('\n')
                }
            })
        ` : ``
    }

    #testSectionComputed() {
        const hasAnyComputed = Object.keys(this.#computedAnalyzedCode).length
        return hasAnyComputed ? `
            ${Object.keys(this.#computedAnalyzedCode)
                .map(
                    (key) => `it('Checks if ${key} computed returns proper value', () => {
                        expect(wrapper.vm.${key}).toBe() ${this.#computedAnalyzer.removeBracketsFromReturnString(this.#computedAnalyzedCode[key])}
                    })`
                )
            .join('\n')}
        ` : ``
    }

    #testSectionMethods() {
        const hasAnyMethods = Object.keys(this.#methodsAnalyzedCode)
        return hasAnyMethods ? `
            ${Object.keys(this.#methodsAnalyzedCode)
                .map((key) => {
                    const {calls, emits, params} = this.#methodsAnalyzedCode[key]

                    return `it('Checks if ${key} method calls proper functions', async () => {
                        ${calls.map(call => `expect(${call}).not.toBeCalled()`).join('\n')}
                        ${emits.map(emit => `expect(wrapper.emitted('${emit}')).toBeFalsy()`).join('\n')}

                        await wrapper.vm.${key}(${params.length ? '/* params expected */' : ''}) /* make sure that the method performs the specified actions */

                        ${calls.map(call => `expect(${call}).${params.length ? 'toBeCalledWith' : 'toBeCalled'}(${params.length ? '/* add payload */' : ''})`).join('\n')}
                        ${emits.map(emit => `expect(wrapper.emitted('${emit}')).toBeTruthy()`).join('\n')}
                    })`
                })
                .join('\n')
            }
        ` : ``
    }

    #testSectionTemplate() {
        const hasAnyComponents = Object.keys(this.#templateAnalyzedCode).length
        return hasAnyComponents 
            ? `
                ${Object.keys(this.#templateAnalyzedCode).map(key => 
                    `it('Check if ${key} component is rendered correctly', () => {\n
                        const ${kebabToCamelCase(key)} = wrapper.${this.#templateAnalyzedCode[key].hasMultipleOccurrences ? 'findAllComponents' : 'findComponent'}(${kebabToPascalCase(key)})
                        
                        /* test component functionality here */
                    })`
                ).join('\n')}
            `
            : ``
    }

    generateTestOutput(){
        return `
            ${this.#testSectionImports()}
            describe('${this.#fileName}', () => {

                ${this.#testSectionDeclaringVariables()}
                ${this.#testSectionBeforeEach()}

                ${this.#testSectionProps()}
                ${this.#testSectionData()}
                ${this.#testSectionComputed()}
                ${this.#testSectionMethods()}
                ${this.#testSectionTemplate()}
            })
        `
    }
}