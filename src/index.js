import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { parse } from '@vue/compiler-sfc';
import { extractRepoDirectory } from "./utils/extractRepoDirectory.js"
import { TestOutputGenerator } from "./generator/TestOutputGenerator.js"


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
  
  const testCode = new TestOutputGenerator(filePath, script, template).generateTestOutput();

  const testPath = path.join('', `${extractRepoDirectory(filePath)}/tests/unit/components/${name}/${name}.spec.ts`);

  fs.mkdirSync(`${extractRepoDirectory(filePath)}/tests/unit/components/${name}`, { recursive: true });
  fs.writeFileSync(testPath, testCode, 'utf-8');

  execSync(`prettier --write "${extractRepoDirectory(filePath)}/tests/**/*.ts"`, { stdio: 'inherit' });

  console.log(`Test file generated: ${testPath}`);
}