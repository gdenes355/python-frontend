import React from "react";
import { Container } from "@mui/material";

const StartPage = () => {
  return (
    <Container>
      <h1>Welcome!</h1>
      <p>
        This code is now open source (MIT) and available on{" "}
        <a
          href="https://github.com/gdenes355/python-frontend"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </a>
      </p>
      <h3>C#</h3>
      <p>
        This branch of PythonSponge is actually running C# using{" "}
        <a href="https://github.com/mono/mono/blob/main/sdks/wasm/README.md">
          Mono's WASM SDK
        </a>
      </p>
      <p>
        To see a C# example book, go to{" "}
        <a href="/?book=./csbook/book.json">/?book=./csbook/book.json</a>
      </p>
      <h3>Original starter page content...</h3>
      <p>
        To see the UI in action and to learn a bit of Python programming, visit{" "}
        <a
          href="https://www.pythonsponge.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Python sponge
        </a>
      </p>
      <div>
        <p>To see a demo, just specify the book path. E.g.</p>
        <ul>
          <li>
            Simple examples with test cases:&nbsp;
            <a href="/?book=./examples/book.json">
              /?book=./examples/book.json
            </a>
          </li>
          <li>
            Fun tasks:&nbsp;
            <a href="/?book=./progsoc/book.json">/?book=./progsoc/book.json</a>
          </li>
          <li>
            Or a library which contains both of the above:&nbsp;
            <a href="/?book=./library.json">/?book=./library.json</a>
          </li>
        </ul>
        <p>
          You can generate a progress report from within the book, or just
          using&nbsp;
          <a href="/?book=./library.json&report=full">
            /?book=./library.json&report=full
          </a>
        </p>
        <p>
          If you would like to upload a zip file, just go to{" "}
          <a href="/?coop=1">/</a>
        </p>
        <h3>For content creators</h3>
        <p>
          To clone a book for editing, you can just append{" "}
          <code>clone=true</code> in the query path. E.g.:
          <a href="/?book=.%2Fexamples%2Fbook.json&chid=afb57340-1197-473c-b24d-5687796fd3d4&edit=clone">
            ?book=.%2Fexamples%2Fbook.json&chid=afb57340-1197-473c-b24d-5687796fd3d4&edit=clone
          </a>
          .
          <p>
            Or you can upload the zip file as well to the landing page{" "}
            <a href="/?teacher=true&coop=1">/?teacher=true&coop=1</a>
          </p>
          <p>
            You can also just use a simple template to get started&nbsp;
            <a href="/?book=/booktemplates/singlepage/book.json&edit=clone">
              /?book=/booktemplates/singlepage/book.json&edit=clone
            </a>
          </p>
        </p>
      </div>
    </Container>
  );
};

export default StartPage;
