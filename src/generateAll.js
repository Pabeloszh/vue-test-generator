import path from 'path';
import fs from 'fs';
import { execSync  } from "child_process"

const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path');
  process.exit(1);
}

const componentsFolder = `${filePath}/components`;
const testsFolder = `${filePath}/tests/unit/components`;

function findVueFiles(folderPath, fileList = []) {
    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findVueFiles(filePath, fileList);
        } else if (file.endsWith('.vue')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function hasTestFile(componentPath, testsFolderPath) {
    const componentName = path.basename(componentPath, '.vue');
    const testFolderPath = path.join(testsFolderPath, componentName);

    try {
        const files = fs.readdirSync(testFolderPath);
        return files.length > 0;
    } catch (error) {
        return false;
    }
}
  
const vueFiles = findVueFiles(componentsFolder);

const componentsWithTests = vueFiles.filter((componentPath) =>
    hasTestFile(componentPath, testsFolder)
);

vueFiles.forEach((componentPath) => {
    const hasTest = componentsWithTests.includes(componentPath);
    
    if(!hasTest) {
        try {
            execSync(`npm run generate-single-test ${path.resolve(componentPath).replace(/\\/g, '/')}`, { stdio: 'ignore' });
            console.log(`Test created successfully for: ${exactFilePath}`);
        } catch (error) {
            console.error(`Test generation error for a component: ${path.resolve(componentPath)}`, `npm run generate-single-test ${path.resolve(componentPath).replace(/\\/g, '/')}`);
        }
    };
});
  