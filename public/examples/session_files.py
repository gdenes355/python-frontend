# upload a session file called data.csv before running this code

with open('session/data.csv', 'r') as f:
    data = f.read()
    print(data)