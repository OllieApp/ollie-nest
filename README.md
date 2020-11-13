
# ollie-nest
## Description

Our Ollie backend API build with [Nest](https://github.com/nestjs/nest) framework in TypeScript.

## Installation

Before running the project, you will have to create your own .env file which contains the necessary parameters for running the app. As a template you can use the **.env.example** file, which contains the definition for the current .env file used by our instances.

```bash
$ npm install
```

## Running the app

As the TypeScript files are compiled to JS, before running the app, be sure to build it with  **npm run-script build** to have a fresh compiled version of the project.
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
