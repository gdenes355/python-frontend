# Wildcards
Test cases can include newline characters (`\n`) as well as the `.*` wildcard. The latter can be particularly useful when you expect the student to print an input prompt, but you don't particularly care about the exact text.


For example, the test case for this challenge is:
```json
"tests": [
  {
    "in": "Alice",
    "out": ".*Hello Alice (Bob says hi)"
  }
]
```
*notice how there is no new line after `.*` in this instance, which would work well with `input("Enter your name")`.*

Under the hood, we just convert the test `out` string into a regex, escaping all control sequencing except for `\n` and `.*`.
