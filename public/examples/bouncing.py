from sys import stdctx
from math import pi
from random import random
from dataclasses import dataclass
import time

##################
# HTML CANVAS VARIABLES
##################


#############
# CONSTANTS
############

SCREEN_WIDTH = 500
SCREEN_HEIGHT = 400
RAD = 10
BAR_WIDTH = 60
BAR_HEIGHT = 10
BAR_MOVE_STEP = 5
BLOCK_WIDTH = 60
BLOCK_HEIGHT = 20

##############
# SETTINGS CLASS
##############


@dataclass
class PaddleSettings:
    x_left: int = (SCREEN_WIDTH - BAR_WIDTH) // 2
    x_change: int = 0


@dataclass
class BallSettings:
    x: int = 0
    y: int = 0
    x_change: int = 2
    y_change: int = 3
    game_over: bool = False

##############
# GLOBAL VARIABLES
##############


# coordinates of top left of each block
blocks = [(150, 30), (250, 50), (350, 70)]

# paddle settings
paddle = PaddleSettings()

# ball settings
ball = BallSettings()

#############
# SUBPROGRAMS
#############


def circle(x, y, r):
    stdctx.beginPath()
    stdctx.arc(x, y, r, 0, pi * 2, True)
    stdctx.fill()


def rect(x, y, w, h):
    stdctx.fillRect(x, y, w, h)


def resetScreen():
    stdctx.fillStyle = "#FAF7F8"
    rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)


def animate():

    # change ball location
    ball.x += ball.x_change
    ball.y += ball.y_change

    # update paddle x-coordinate
    paddle.x_left += paddle.x_change
    paddle.x_change = 0

    # clear screen
    resetScreen()

    if stdctx.check_key(39):
        paddle.x_change = BAR_MOVE_STEP
    elif stdctx.check_key(37):
        paddle.x_change = -BAR_MOVE_STEP

    # draw green brick and check for brick hit
    stdctx.fillStyle = "#00FF00"
    for a, b in blocks:
        if a - RAD <= ball.x <= a + BLOCK_WIDTH + RAD and b - RAD <= ball.y <= b + BLOCK_HEIGHT + RAD:
            blocks.remove((a, b))
            ball.y_change = -ball.y_change * (0.9 + 0.2 * random())
        else:
            rect(a, b, BLOCK_WIDTH, BLOCK_HEIGHT)

    # bouncing off edge
    if ball.x > SCREEN_WIDTH or ball.x < 0:
        ball.x_change = -ball.x_change
        ball.x += ball.x_change

    if ball.y < 0:
        ball.y_change = -ball.y_change
        ball.y += ball.y_change

    # bouncing off bar
    if paddle.x_left <= ball.x <= paddle.x_left + BAR_WIDTH and ball.y >= (SCREEN_HEIGHT - 2 * BAR_HEIGHT):
        ball.y_change = -ball.y_change * (0.9 + 0.2 * random())
        ball.y += ball.y_change

    # draw ball
    stdctx.fillStyle = "#444444"
    circle(ball.x, ball.y, RAD)

    # draw paddle
    stdctx.fillStyle = "#FF0000"
    rect(paddle.x_left, SCREEN_HEIGHT - 2 * BAR_HEIGHT, BAR_WIDTH, BAR_HEIGHT)

    # check for lost game
    if ball.y > SCREEN_HEIGHT:
        ball.game_over = True


resetScreen()
while True:
    time.sleep(1 / 60)
    animate()
    stdctx.present()
    if stdctx.check_key(ord("Q")) or ball.game_over:
        break
