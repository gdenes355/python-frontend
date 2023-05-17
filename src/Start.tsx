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
            <a href="/?bk=./examples/book.json">/?bk=./examples/book.json</a>
          </li>
          <li>
            Fun tasks:&nbsp;
            <a href="/?bk=./progsoc/book.json">/?bk=./progsoc/book.json</a>
          </li>
          <li>
            Or a library which contains both of the above:&nbsp;
            <a href="/?bk=./library.json">/?bk=./library.json</a>
          </li>
        </ul>
        <p>
          You can generate a progress report from within the book, or just
          using&nbsp;
          <a href="/?bk=./library.json&report=full">
            /?bk=./library.json&report=full
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
          <a href="/?bk=.%2Fexamples%2Fbook.json&edit=clone">
            ?bk=.%2Fexamples%2Fbook.json&edit=clone
          </a>
          .
          <p>
            Or you can upload the zip file as well to the landing page{" "}
            <a href="/?teacher=true&coop=1">/?teacher=true&coop=1</a>
          </p>
          <p>
            You can also just use a simple template to get started&nbsp;
            <a href="/?bk=/booktemplates/singlepage/book.json&edit=clone">
              /?bk=/booktemplates/singlepage/book.json&edit=clone
            </a>
          </p>
        </p>
      </div>
    </Container>
  );
};

export default StartPage;
