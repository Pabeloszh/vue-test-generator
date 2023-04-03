import cheerio from 'cheerio';
import { parseComponent } from 'vue-template-compiler';

export class TemplateAnalyzer {
    #code

    constructor(code) {
        this.#code = code
    }

    analyzedCode() {
        const template  = this.#code;

        const $ = cheerio.load(template.content, {
            decodeEntities: false,
            xmlMode: true,
        });

        const templateComponents = $('*')
            .map((_, el) => {
                const tagName = el.tagName.toLowerCase();
                return tagName.includes('-') && ({ tagName, hasMultipleOccurrences: el.attribs.hasOwnProperty('v-for') });
                
            })
            .get()
            .filter(Boolean)

        const components = templateComponents.reduce((acc, curr) => {
                acc[curr.tagName] = { hasMultipleOccurrences: curr.hasMultipleOccurrences || Boolean(templateComponents.filter(({tagName}) => tagName === curr.tagName).length > 1) }
                return acc
            }, {})

        return components
    }
}