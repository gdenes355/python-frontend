import turtle

# use the Screen object to set the canvas size and also the color mode
sc = turtle.Screen()
sc.colormode(255.0)
sc.setup(600,450)


t = turtle.Turtle()
t.pensize(3)

# use named colour or rgb via tuple, 3 params or colour code
# t.pencolor("red")
# t.pencolor("#ff0000")
# if colormode is set to 255
# t.pencolor((174,68,23)) 
# t.pencolor(174,68,23)
# if colormode is set to 1.0 (default)
# t.pencolor((0.68,0.27,0.09))
# t.pencolor(0.68,0.27,0.09)

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