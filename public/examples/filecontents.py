FILENAME = 'numbers.txt'

numOfNumbers = int(input('Enter a positive integer: '))

outfile = open(_____________,____)

for i in range(numOfNumbers):
    outfile.write(str(2 * i + 1) + '\n')

# ==> close the file
outfile.________()
