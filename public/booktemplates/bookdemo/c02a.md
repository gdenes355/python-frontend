# Advanced Test Cases

In the simple test case setup from the previous page, `in` is a string and `out` is a string. 

However, you can customise your tests further.

## `in`  
can also be a list of items (strings or numbers), each will be provided as one input in turn.

## `out`
can be a string, or a list of output requirements to be checked, where
  * `pattern` is a regular expression. Note that `\` needs to be escaped in json, so `\\d` means a digit.
  * `typ`:
    * `+` means output must match this requirement (default)
    * `-` means output must not match this requirement
    * `c+` means the code must match this requirement
    * `c-` means the code must not match this requirement
  * `ignore`: each output requirement can include `ignore` flags so that tests can pass with slight differences to the expected output, as students can make small mistakes that are not relevant to the overall pass/fail result. 3 classes of errors that can be ignored are **w**hitespace, **p**unctuation and **c**apitalization of text. If the difference between the expected and actual output fall into an ignore class, then the test should pass. This is given as a string of flag initial letter.
  * `count`: interpreted to mean that the output must occur exactly `count` number of times. If not given, this defaults to -1, which means we don't care how many times the match occured. A `count` with a type `–` means that the string must not occur **exactly** `count` times.

  E.g.

```json
"tests": [
  {
    "in": [4, 5],
    "out": [
      {"pattern":"Enter    a;", "ignore":"wcp"},
      {"pattern":"Enter b:"},
      {"typ":"+", "pattern":"One num was \\d", "count":2, "ignore":"w"},
      {"typ":"-", "pattern":"Enter c", "ignore":"wcp"},      
      {"pattern": "sum.*9", "ignore": "wc"},
      {"typ": "c+", "pattern": "int\\(input\\(", "count": "2", "ignore": "w"}
    ]
  }
]
```

Which means:
  * 4 will be provided as the first input and 5 as the second
  * the output must contain `Enter a;` ingnoring any variation in whitespace or case or punctuation so the ; vs : won't be an issue
  * the output must contain `Enter b:` exactly (including case)
  * the output must contain `One num was <digit>` exactly two times (ignoring whitespace)
  * the output must NOT contain `Enter c`(ignoring whitespace, case and punctuation)
  * the output must contain `sum` followed by an number of characters and then `9` (ignoring whitespace and case)
  * the CODE must contain `int(input(` exactly two times (ignoring whitespace)