using System.Diagnostics.CodeAnalysis;

namespace JsTreeWithDotNetCoreAndCSharp.Domain
{
    public class TreeNode
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid? ParentId { get; set; }

        private TreeNode()
        {
        }

        internal TreeNode(
            Guid id, 
            [NotNull]string name, 
            Guid? parentId)
        {
            Id = id;
            Name = name;
            ParentId = parentId;
        }

        private void SetName(string name)
        {
            Name = name;
        }

        public TreeNode ChangeName(string newName)
        {
            SetName(newName);
            return this;
        }
    }
}
