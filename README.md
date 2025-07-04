# DealMemo

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## To deploy to GitHub Pages

First add angular-cli-ghpages to your project:

```bash
ng add angular-cli-ghpages
```

Then build your project for production:

```bash
ng deploy --base-href=/deal-memo-studio/ 
```

or:

```bash
ng deploy --dir=dist/deal-memo/browser --base-href=/deal-memo-studio/
```

Open your browser and navigate to `https://<your-github-username>.github.io/deal-memo-studio/` to see your deployed application.

## To undeploy from GitHub Pages

To undeploy your application from GitHub Pages, delete the gh-pages branch from your local repository and the remote repository.:

```bash
# Delete the local gh-pages branch
git branch -D gh-pages

# Delete the remote gh-pages branch
git push origin --delete gh-pages
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


ng deploy --dir=dist/deal-memo/browser --base-href=/deal-memo-studio/
