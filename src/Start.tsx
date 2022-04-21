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
            <a href="/?book=./examples/book.json">
              /?book=./examples/book.json
            </a>
          </li>
          <li>
            Fun tasks:&nbsp;
            <a href="/?book=./progsoc/book.json">/?book=./progsoc/book.json</a>
          </li>
          <li>
            You can also specify a library of books:&nbsp;
            <a href="/?book=./library.json">/?book=./library.json</a>
          </li>
        </ul>
        <p>
          You can now generate a progress report using&nbsp;
          <a href="/?book=./library.json&report=full">
            /?book=./library.json&report=full
          </a>
        </p>
      </div>
    </Container>
  );
};

export default StartPage;
