import random
import time

def Door1():
    print("There are three doors in front of you: 2 doors are safe, one has a hungry tiger behind it")
    doorchoice = input("Enter the door you want to go through (1-3): ")
    randomdoor = random.randint(1,3)
    if doorchoice == randomdoor:
        print("You open the door to find a hungry tiger, licking its lips.")
        return "GameOver"
    else:
        print("You open the door to find that you are safe, you keep walking")
        return "Continue"

def Door2():
    print("You again find three doors in front of you: This time, 2 of the doors have pitfalls into lava, and only one is safe")
    doorchoice = input("Enter the door you want to go through (1-3):")
    # ===> WHOOPS MISTAKE BELOW
    randomdoor = random.randint(1,5)
    if doorchoice == randomdoor:
        print("You open the door to find that you are safe, you keep walking")
        return "Continue"
    else:
        print("You open the door to find a blank wall. Suddenly the floor drops out from underneath you, and you fall into a lava pit.")
        return "GameOver"
    
def Door3():
    print("You again find three doors in front of you: This time, 2 of the doors have pirahnas in them, and only one is safe")
    doorchoice = input("Enter the door you want to go through (1-3):")
    randomdoor = random.randint(1,3)

    # ===> WHOOPS MISTAKE BELOW (THIS DOESN'T GIVE A 1 IN 3 SAFE CHANCE)
    if doorchoice != randomdoor:
        print("You open the door to find that you are safe, you keep walking")
        return "Continue"
    else:
        # ===> WHOOPS MISTAKE BELOW (THIS ISN'T THE RIGHT MESSAGE)
        print("You open the door to find a blank wall. Suddenly the floor drops out from underneath you, and you fall into a lava pit.")
        return "GameOver"

def MainGame():
    print("You wake up.")
    door1 = Door1()
    if door1 == "GameOver":
        print("Game Over!")
        return
    time.sleep(1)
    door2 = Door2()
    if door2 == "GameOver":
        print("GameOver!")
        return
    time.sleep(1)
    door3 = Door3()
    if door3 == "GameOver":
        print("GameOver!")
        return
    else:
        print("You won! Well done!")        

# run the main game
MainGame()
