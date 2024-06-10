using System.Runtime.Serialization;

namespace JsTreeWithDotNetCoreAndCSharp.Domain.Exceptions
{
    [Serializable]
    internal class ThisTreeNodeHasChildrenException : Exception
    {
        public ThisTreeNodeHasChildrenException() :
            base(message: "This tree node has children, and deletion is not permitted.")
        {
        }
    }
}