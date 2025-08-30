[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Netlify Status](https://api.netlify.com/api/v1/badges/0a4ab609-ce3f-426b-9319-356b99fcc907/deploy-status)](https://gdenes355-python-frontend.netlify.app/)

# Python frontend in the browser
This project combines React, Pyodide and Material UI alongside a handful of amazing open-source software to create a lightweight, in-browser educational platform for those who want to improve their Python knowledge, and those who want to author educational material for Python learners.

Once the website loads, everything happens purely client-side, no paid server, no subscription, and no installation required.

# Getting started

## ...as a Python learner
[Python Sponge](https://www.pythonsponge.com/) builds on this codebase, check out the available challenges there.

## ...as an educator
You can author challenges without knowing any JavaScript or React. The challenge sets are described by `.json` files, the starter codes are simply `.py` files, and the guide text on the right is rendered from `.md` markdown files. For an example book.json, see [book.json](/public/examples/book.json). For a full documentation, see the bottom of this page.

Once you have created a book with the correct `.py` and `.md` files, you need to zip these up. The zip files can be then used directly on the index page (via drag-and-drop), or you can host them on a github page and use them such as [https://www.pythonsponge.com/pages.html?book=https://bakerpdgit.github.io/pythonspongechallenges/book.json](https://www.pythonsponge.com/pages.html?book=https://bakerpdgit.github.io/pythonspongechallenges/book.json)

You *can* also roll out this frontend application without using PythonSponge by grabbing the built package from Github. Just replace index.html if you would like to customise the page title etc. Once again, no JS/TS or React knowledge required here, the built package is ready to go as it is. (**package building is currently WIP**). Once you have your site running, you can go to `/start` for a few examples.

## ...as a JS/TS/React developer
...or as someone who would like to understand and improve this frontend repo. 

This project was bootstrapped with CRA, later ported to Vite + React + TS.

Once you have cloned the repository, you need to make sure that you have NodeJS and npm installed on your computer. VSCode or some other IDE is also recommended. In the project directory, you can run:

#### `npm install`

Installs all npm dependencies. Might take some time; must be run before first launching the app.

#### `npm run dev`

Runs the app in the development mode. Open [http://localhost:3000?coop=1](http://localhost:3000?coop=1) to view it in your browser. [http://localhost:3000/start](http://localhost:3000/start) has some code demos.
The page will reload when you make changes. You may also see any lint errors in the console.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

You can host your static build on github pages or some other static web hosting for free.

#### `npm run build-standalone`

Builds the app for production into the `portable/data` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

Your site is ready to run even if you don't have access to the internet.\
For ease of use, on Windows you can just launch `portable/PythonSponge.bat` which makes use of [civetweb](https://github.com/civetweb/civetweb) to host the site locally.

#### `npm run build-standalone-with-wheels`

The standalone build only contains core Python packages. If you want to ship custom wheels in the bundle, then this command will fetch the appropriate wheels from cdn at build time. The list of packages are defined in `vite.config.ts` (with transitive closure downloading all dependencies recursively)

# Learn More

You can learn more in the the [React documentation](https://reactjs.org/).

For UI elements, we have mostly used [Material UI 5](https://mui.com/), and the excellent [Monaco editor](https://microsoft.github.io/monaco-editor/).

# Feature overview
* High-quality code editor via [Monaco editor](https://microsoft.github.io/monaco-editor/).
* In-browser debugging via [Pyodide](https://pyodide.org/)
  * Support for breakpoints (click left of the line numbers at the window edge)
  * Line-by-line stepping (once the debugger is on a break)
  * Support for a number of built-in libraries through Pyodide, including `time`, `random`
  * Support for the `turtle` library; see demo [on Python sponge](https://www.pythonsponge.com/pages.html?book=.%2Fturtle%2Fbook.json)
  * Support for basic canvas operations; see demo [on Python sponge](https://www.pythonsponge.com/pages.html?book=.%2Fgraphical%2Fbook.json)
* Parson problems via [Js Parsons](https://js-parsons.github.io/)
* Challenges can have test cases associated with them (specified in the `book.json` file)
* The ability to group challenges into sections (specified in the `book.json` file)
* Code changes saved to local storage (in browser) every time the user presses debug
* Progress (for test-case associated challenges) tracked; students can easily produce a report (via the sandwich menu -> Report page button)
* Students can download current `.py` file to their hard drives (see button in top-right)
* Students can upload a `py` file to continue their work even on a different computer (see button in top-right)
* competition-style input hardcoding is available (see top-right ... -> Use fixed inputs)

# `book.json` documentation
Even if you just author a single challenge, you will want to create a book for it. A book captures the following basic information in json:
* `py`: the relative path to the `.py` file. Could be also an absolute path to a web address.
* `guide`: the relative path to the `.md` file which contains the guide text in [Markdown](https://www.markdownguide.org/basic-syntax/)
* `isExample`: `true`/`false`. If this is an example, the student receives a green tick upon running the code at least once to completion. defaults to `false`
* `isSessionFilesAllowed`: `true`/`false`. If session files are enabled, the student can upload their own files that will be mapped under `session/`. Session files are not saved across reloads, but can be a quick and easy way to work with large csv files / images without hosting them online. defaults to `false`
* `isLong`: `true`/`false`. If this is a *long* code challenge, the editor will expect the code file to be over 4000 characters long. Such code might be saved differently. Currently only used when saving student progress to a server. Avoid setting this flag on many challenges in a book. defaults to `false`
* `typ`: `py`: Python code challenge, `parsons`: Py code is turned into a Parsons challenge, `canvas`: Python code challenge with a canvas. defaults to `py`
* `tests`: Test cases (see examples further down).
* `children`: if this is a section node, then all the challenges in this section. Sections can be nested.

On top of this, every node **must** specify a unique ID. It is best if this is a `uuid` generated programatically or a tool like [UUID generator](https://www.uuidgenerator.net/version4).

Most properties are optional. There are four typical use cases:

## A section header
If this is a section header, then there is no code associated with the node, all the important content will be in the `children`. E.g. 
```json
{
    "name": "Example challenges",
    "id": "afd0702d-7ae3-4c71-8776-e1d06cee47a4",
    "children": [...more code here...]
}
```

## An example code
Example codes have no test cases associated with them, but you need a guide and a starter code.
```json
{
  "name": "Input example",
  "id": "b779bde6-45a2-4eb2-a588-97ee55bc7f94",
  "py": "anExample.py",
  "guide": "anExample.md",
  "isExample": true
}
```

## A fun task (open-ended)
Sometimes you just want your students to go wild, and giving them a green tick doesn't make sense. 
```json
{
  "name": "Fun task",
  "id": "666642fa-8efb-4a1a-bdfb-832cc36e430c",
  "py": "textAdventure.py",
  "guide": "textAdventure.md",
}
```

## Additional files
You can provide additional input files using the `additionalFiles` fiels. E.g. the following will expose the contents of `test1.txt` and `test2.txt` to Python. Any `visible` file will also appear to the student next to the console tab.
```
"additionalFiles": [
    {
        "filename": "test1.txt",
        "visible": true
    },
    {
        "filename": "test2.txt",
        "visible": false
    }
]
```

## A task with test cases
Ideal for keeping track of progress, when you give a chance for your students to practice their Python skills.
```json
{
            "id": "afb57340-1197-473c-b24d-5687796fd3d4",
            "name": "Hello world",
            "guide": "c01.md",
            "py": "c01.py",
            "tests": [
                {
                    "in": "",
                    "out": "hello world"
                }
            ]
        },
```

`tests` is a list of test cases.

## Test cases
Each test case has an `input` and `output` field. The input field specifies how the tester will respond to `input()` command, while the `output` is checked against all printed output (ignoring leading/trailing spaces and new lines). In the simplest setup, lines are split on `\n` characters. `output` handles within-line `.*` wildcards.

### example
For a short case study, let's imagine the student has to write a program which inputs two numbers, then outputs the larger one.

The input of the program will be the two numbers. The `\n` acts as a separator. 
```json
"in": "5\n6"
```

The output of the program will the larger number. In this case, it might be simply
```json
"out": "5"
```

An example solution is
```py
a = int(input())
b = int(input())
```

Often you want students to add some meaningful input, but it is hard to predict their creative messages. In this case, a `.*` wildcard will match any character **within-line** (i.e. until the next `\n`).
An updated test case might look like this:
```json
{
  "in": "5\n6",
  "out": ".*\n.*\n6"
}
```

## More formally (advanced testing options)
The `"in"` property can be a string, such as `"in": "Alice"`. If you pick this option, then you can use the `\n` character to enter multiple lines of text.
However, `"in"` can be also provided as a list of string/numerical values, such as `"in": ["Joe", 5, 2, "yes"]`.

The `"out"` property can be a string, such as `"Hello Alice"`. If you pick this option, then you can use the `\n` to match new lines and `.*` to match anything up to the end of a line. Blank new lines at the end of the output are ignored. Comparison is case sensitive.

However, `"out"` can be also provided as a list of matching requirements, where each requirement contains a
* `pattern` is a **regular expression**. Note that `\` needs to be escaped in json, so `\\d` means a digit. If you would like to handle `pattern` as plaintext, you can set `"regex": false`
* optional `typ`:
  * `+` means output must match this requirement (default)
  * `-` means output must not match this requirement
  * `c+` means the code must match this requirement
  * `c-` means the code must not match this requirement  
  * `f+` means that the contents of the file specified by filename after running must match this requirement
  * `f-` means that the contents of the file specified by filename after running must not match this requirement
  * `s+` means that the value of the code specified by statement, when evaluated & cast to a string, must match this requirement
  * `s-` means that the value of the code specified by statement, when evaluated & cast to a string, must not match this requirement
* optional `ignore`: each output requirement can include `ignore` flags so that tests can pass with slight differences to the expected output, as students can make small mistakes that are not relevant to the overall pass/fail result. 3 classes of errors that can be ignored are **w**hitespace, **p**unctuation and **c**apitalization (case) of text. If the difference between the expected and actual output fall into an ignore class, then the test should pass. This is given as a string of flag initial letter.
* `count`: interpreted to mean that the output must occur exactly `count` number of times. If not given, this defaults to -1, which means we don't care how many times the match occured. A `count` with a type `–` means that the string must not occur **exactly** `count` times.
* `regex`: is the pattern a regex? Default is **true**.

E.g.

```json
"tests": [
  {
    "in": [4, 5],
    "out": [
      {"pattern":"Enter    a;", "ignore":"wcp"},
      {"pattern":"Enter b:"},
      {"typ":"-", "pattern":"Hello 3"},
      {"typ":"+", "pattern":"Hello \\d", "count":2, "ignore":"w"},
      {"pattern": "sum.*9", "ignore": "wc"},
      {"typ": "c+", "pattern": "int\\(input\\(", "count": 2, "ignore": "w"}
      {"typ": "f+", "filename":"numbers.txt", "pattern":"Hello \\d", "count":2, "ignore":"w"}
    ]
  }
]
```

*potential caveat: these advanced output requirements support regexes, but the use of the ignore flags can conflict with complex expressions. Regex supports case insensitive comparisons, but white space ignores are achieved by stripping white spaces and punctuation ignores are achieved by stripping punctuations. To avoid any conflicts, avoid using additional punctuations in your regex when using these flags. E.g. `Hello .* how are you` is fine, but `Hello .*, how are you` is risky.*

# Tracking student progress on a server
The frontend is portable and serverless. However, if you wanted to track student progress, mark work online etc., we have some frameworks already in place.
[Documentation](api.html) for the backend API. Sample server [here](https://github.com/gdenes355/pythonsponge-server).

To regenrate the swagger documentation, run
`npx @redocly/cli build-docs --output api.html .\api.yml`

# Contributing to the project
We welcome code additions to this github repo via PRs as long as they are in-line with the original design intentions of the project:
* lightweight in-browser client-side code execution
* enabling Python learners and educators
* serving as a platform to facilitate learning (challange sets in the repo are examples/demos)
* maintain open-source MIT license

## Contributors
<a href = "https://github.com/gdenes355/python-frontend/graphs/contributors">
<img src = "https://contrib.rocks/image?repo=gdenes355/python-frontend"/>
</a>

# License
MIT License

Copyright (c) 2022 Gyorgy Denes, Paul Baker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

