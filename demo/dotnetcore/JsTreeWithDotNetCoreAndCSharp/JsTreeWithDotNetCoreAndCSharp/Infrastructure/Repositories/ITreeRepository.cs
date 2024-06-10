using JsTreeWithDotNetCoreAndCSharp.Domain;

namespace JsTreeWithDotNetCoreAndCSharp.Infrastructure.Repositories
{
    public interface ITreeRepository : IRepository<TreeNode, Guid>
    {
    }
}
