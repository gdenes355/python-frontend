import turtle
t = turtle.Turtle()

t.pencolor((255,0,0))
t.fillcolor("gold")
t.begin_fill()

for _ in range(6):
  t.forward(50)
  t.right(60)

t.end_fill()