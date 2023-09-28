# library imports
import turtle

# global variables
myTurtle = turtle.Turtle()

# start
for count in range(4):
  myTurtle.forward(100)
  myTurtle.left(90)
# end

# keep turtle screen visible on end
turtle.done()