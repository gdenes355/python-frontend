EMPTY = "-"
board = [
    [EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY]]

def printBoard(board):
    print()
    for row in board:
        print(" ".join(row))
    print()

def checkForDraw(board):
    # ==> TASK : WRITE SOME CODE TO CHECK IF THE GAME HAS BEEN DRAWN.
    # (Hint: If the game has been drawn, there will not be any empty spaces left)
    # (You could use the count() function to help you here (www.w3schools.com/python/ref_list_count.asp))
    return False

def checkForWinner(board):
    # ==> TASK : CURRENTLY THE CODE ONLY CHECKS FOR A WIN ON THE FIRST ROW AND FOR ONE DIAGONAL
    # WRITE SOME CODE THAT WILL CHECK FOR ALL WIN POSSIBILITIES?
    
    # Checks for horizontal lines of 3
    if board[0][0] == board[0][1] == board[0][2] != EMPTY:
        return board[0][0]

    # Checks for a diagonal line of 3
    if board[0][0] == board[1][1] == board[2][2] != EMPTY: 
        return board[0][0]

    return ""


finished = False
nextPlayer = {"X":"O", "O":"X"}
player = "X"

while finished == False:

    printBoard(board)

    print(f'{player} to play next')

    # ==> TASK : CAN YOU ADD SOME EXTRA VALIDATION TO PREVENT AN ERROR IF A NUMBER OUTSIDE OF 1-3 IS ENTERED
  
    while True:
      row = int(input("Input Row: "))
      col = int(input("Input Col: "))    
  
      if board[row-1][col-1] == EMPTY:
          board[row-1][col-1] = player          
          # Switches to other player after a move is made
          player = nextPlayer[player]
          break  
      else:
          print("That position is occupied, try again.")

    winnerCheck = checkForWinner(board)
    if winnerCheck != "":
        print(f"{winnerCheck} wins! Game Over")
        finished = True
    else:
      finished = checkForDraw(board)
