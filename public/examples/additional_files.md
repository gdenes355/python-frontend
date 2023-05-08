# Additional files
You can add additional text files to your challenge by using the `additionalFiles` field in the challenge json.
For instance, the following will expose the contents of `test1.txt` and `test2.txt` to Python. Any `visible` file will also appear to the student next to the console tab.
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