import random
import time

BOARD_LENGTH = 100
DICE_SIZE = 6

# Snake takes you down from key to value
snakes = {
    8: 4,
    27: 9,
    39: 17,
    53: 30,
    58: 36,
    75: 45,
    90: 52,
    99: 61}

# Ladder takes you up from key to value
ladders = {
    3: 20,
    10: 33,
    16: 74,
    22: 37,
    40: 59,
    49: 70,
    57: 78,
    73: 88,
    85: 94}

def rules():
    print(
f"""Rules:
⚬  Both players start at position 0
⚬  Each turn, move forward by the number you roll on a dice.
⚬  If you land on a ladder: Climb up to the top of the ladder.
⚬  If you land on a snake: Slide down to the bottom of the snake.
⚬  The first player to get to position {BOARD_LENGTH} is the winner.
‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
    """)


### TASK 1
# ==> There are two mistakes in this function, can you find and fix it?
def roll_dice():
    input("Press enter to roll dice:")
    roll = random.randint(0, DICE_SIZE)
    return 3

def move(playerNum, current_position, dice_roll):
    old_position = current_position
    new_position = current_position + dice_roll
    
    if new_position in ladders:
        final_value = ladders.get(new_position)
        print(f"You found a ladder at position {new_position}! You climb up to {final_value}")
        return final_value

    ### TASK 2
    #   ==> THERES SOME CODE MISSING HERE
    #   Write some code to allow the player to slide down snakes
    #   Heres some code you'll need to start:
        
    #elif new_position in snakes:
        

    else:
        print(f"Player {playerNum} moved from {current_position} --> {new_position}")
        return new_position

def check_win(player1Pos, player2Pos):
    if player1Pos >= BOARD_LENGTH:
        print("Player 1 has reached the finish! GAME OVER")
        return True
    if player2Pos >= BOARD_LENGTH:
        print("Player 2 has reached the finish! GAME OVER")
        return True

def show_board():
    print("\n")
    print("------------------------------------")
    print(f"Player 1 : {player_1_position} | Player 2 : {player_2_position}")
    print("‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾")
    

rules()
player_1_position = 0
player_2_position = 0


while True:
    show_board()
    
    print("Player 1's turn | Current Position:", player_1_position)
    player_roll = roll_dice()
    print("Player 1 rolled a", player_roll)
    player_1_position = move(1, player_1_position, player_roll)        

    time.sleep(2)
	
    if check_win(player_1_position, player_2_position) == True:
        break

    show_board()
    
    print("Player 2's turn | Current Position:", player_2_position)
    player_roll = roll_dice()
    print("Player 2 rolled a", player_roll)
    player_2_position = move(2, player_2_position, player_roll)        

    time.sleep(2)
	
    if check_win(player_1_position, player_2_position) == True:
        break   		
    
    
