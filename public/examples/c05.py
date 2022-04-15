import turtle
t = turtle.Turtle()

t.pencolor((174,68,23)) # use rgb tuple or named colour
t.pensize(3)

colors = ["gold", "purple", "green"]

t.setposition(-200, 0)

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