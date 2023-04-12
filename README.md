# Vue SFC Unit Test Generator

This script generates unit tests for Vue single-file components using vue-test-utils and Jest. It is designed to be used in a Nuxt.js project. The script analyzes the component and generates a test script covering about 80% of the test file.

## Installation

To use this script, clone the repository and install the dependencies using npm:

```bash
git clone https://github.com/Pabeloszh/vue-test-generator
cd vue-test-generator
npm install
```

## Usage

To generate unit tests for a Vue component, run the following command:

```bash
npm run generate-test <component-path>
```

The **'<component-path>'** argument should be the full path to the Vue component. The script will generate a **'.spec.ts'**  file in the **'tests/unit/components'** directory of your Nuxt.js project.

## Example 
```bash
npm run generate-test C:/my-projects/nuxt-app/components/AvailabilityForm/AvailabilityForm.vue
```

## Contributing

Feel free to submit pull requests and suggest improvements