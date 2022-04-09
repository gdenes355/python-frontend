from sys import stdctx
import time
from math import pi

stdctx.fillStyle = "red"

stdctx.fillText("hello world", 50, 50, clearCanvas=True)

time.sleep(1)

# this doesn't work - because multiple commands?
stdctx.beginPath()
stdctx.arc(50, 50, 10, 0, pi * 2)
stdctx.fill(clearCanvas=True)

time.sleep(1)

for sq in range(3):
<<<<<<< Updated upstream
  
  stdctx.fillRect(50*sq, 50*sq, 50*(sq+1), 50*(sq+1), clearCanvas=True)
  time.sleep(1)

=======

  stdctx.fillRect(50*sq, 50*sq, 50*(sq+1), 50*(sq+1), clearCanvas=True)
  time.sleep(1)
>>>>>>> Stashed changes
