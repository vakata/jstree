using System.Runtime.Serialization;

namespace JsTreeWithDotNetCoreAndCSharp.Domain.Exceptions
{
    [Serializable]
    internal class TheNameIsAlreadyTakenException : Exception
    {
        public TheNameIsAlreadyTakenException(string name) :
            base(message: $"The name '{name}' is already taken!")
        {
        }
    }
}