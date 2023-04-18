import turtle
t = turtle.Turtle()

t.pensize(3)

# use named colour or colour codes as strings e.g. "#ff0000" or colour tuple e.g. (255, 0, 0)
colors = ["gold", "purple", "#00ff00"]

t.penup()
t.setposition(-200, 0)
t.pendown()

for idx, color in enumerate(colors):

  t.fillcolor(color)
  t.begin_fill()

  for _ in range(idx+3):
    t.forward(50)
    t.right(360 / (idx + 3))

  t.end_fill()

  t.penup()
  t.forward(100)
  t.pendown()

t.penup()
t.right(90)
t.forward(25)
t.pendown()
t.fillcolor("orange")
t.begin_fill()
t.circle(30, 360)
t.end_fill()