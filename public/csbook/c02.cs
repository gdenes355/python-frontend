using System;

namespace Sponge.Compiler.Demo
{
    public class RunClass
    {
        public static void Main(string[] args)
        {
          Console.WriteLine("How many sides should the polygon have?");
          int numberOfSides = int.Parse(Console.ReadLine());
          
          double scale = 500.0 / numberOfSides;

          var timmy = new Sponge.Turtle();
          timmy.Speed(9);
          timmy.Width(2.5);
          timmy.PenColor("red");
          timmy.FillColor(1.0, 1.0, 0.0);
          timmy.BeginFill();
          for (int i = 0; i < numberOfSides; i++) 
          {
            timmy.Forward(scale);
            timmy.Left(360 / numberOfSides);
          }
          timmy.EndFill();
        }
    }
}