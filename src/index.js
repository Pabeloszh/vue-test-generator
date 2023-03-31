import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { parse } from '@vue/compiler-sfc';
import { ScriptParser } from "./script/ScriptParser.js"
import { PropsAnalyzer } from "./script/PropsAnalyzer.js"
import { DataAnalyzer } from "./script/DataAnalyzer.js"
import { ComputedAnalyzer } from "./script/ComputedAnalyzer.js"
import { MethodsAnalyzer } from "./script/MethodsAnalyzer.js"

const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path');
  process.exit(1);
}

generateTest(filePath);

function generateTest(filePath) {
  const { name } = path.parse(filePath);

  const content = fs.readFileSync(filePath, 'utf-8');
  const { descriptor } = parse(content);

  const { script, template } = descriptor;
  
  const testCode = generateTestCode(name, script, template);

  const testPath = path.join('', `./tests/unit/components/${name}/${name}.spec.ts`);

  fs.mkdirSync(`./tests/unit/components/${name}`, { recursive: true });
  fs.writeFileSync(testPath, testCode, 'utf-8');

  execSync('prettier --write "tests/**/*.ts"', { stdio: 'inherit' });

  console.log(`Test file generated: ${testPath}`);
}


function generateTestCode(name, script, template) {
  const scriptParser = ScriptParser(script)
  const propsAnalyzer = PropsAnalyzer(scriptParser.getSection('props'))
  const dataAnalyzer = DataAnalyzer(scriptParser.getSection('data'))
  const computedAnalyzer = ComputedAnalyzer(scriptParser.getSection('computed'), propsAnalyzer.analyzedCode, dataAnalyzer.analyzedCode)
  const methodsAnalyzer = MethodsAnalyzer(scriptParser.getSection('methods'))
  
  templateGenerator(name, script, template)

  const testOutput = 
`import { shallowMount } from '@vue/test-utils';
import ${name} from '@/components/${name}.vue';

describe('${name}', () => {
    let wrapper: any
    
    beforeEach(() => {
      wrapper = shallowMount(${name}, {
        
      })
    })

    ${propsAnalyzer.generatedTests}
    ${dataAnalyzer.generatedTests}
    ${computedAnalyzer.generatedTests}
    ${methodsAnalyzer.generatedTests}
  });
`
  return testOutput
}
