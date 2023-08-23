import path from 'path';
import fs from 'fs';

const componentsFolder = 'C:/atos/recruitment-tracker/components';
const testsFolder = 'C:/atos/recruitment-tracker/tests/unit/components';

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
  
console.log(`List of missing tests (${vueFiles.length - componentsWithTests.length} / ${vueFiles.length}):`);
vueFiles.forEach((componentPath) => {
    const componentName = path.basename(componentPath, '.vue');
    const hasTest = componentsWithTests.includes(componentPath);
    
    if(!hasTest) console.log(`- ${componentName}   (${componentPath})`);
});
  