using System.Runtime.Serialization;

namespace JsTreeWithDotNetCoreAndCSharp.Domain.Exceptions
{
    [Serializable]
    internal class TreeNodeAlreadyPresentAtThisLocationException : Exception
    {
        public TreeNodeAlreadyPresentAtThisLocationException(string name) :
            base(message: $"The '{name}' node is already present at this location.")
        {
        }
    }
}