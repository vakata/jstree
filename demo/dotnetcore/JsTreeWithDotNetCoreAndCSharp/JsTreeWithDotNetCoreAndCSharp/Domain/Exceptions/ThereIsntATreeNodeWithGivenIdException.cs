using System.Runtime.Serialization;

namespace JsTreeWithDotNetCoreAndCSharp.Domain.Exceptions
{
    [Serializable]
    internal class ThereIsntATreeNodeWithGivenIdException : Exception
    {
        public ThereIsntATreeNodeWithGivenIdException() :
            base(message: "There isn't a tree node with given id.")
        {
        }
    }
}