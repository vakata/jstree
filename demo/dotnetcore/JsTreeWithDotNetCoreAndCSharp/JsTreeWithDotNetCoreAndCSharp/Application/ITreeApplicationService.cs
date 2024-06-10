using JsTreeWithDotNetCoreAndCSharp.Application.Dtos;
using JsTreeWithDotNetCoreAndCSharp.Infrastructure;

namespace JsTreeWithDotNetCoreAndCSharp.Application
{
    public interface ITreeApplicationService
    {
        Task<List<TreeNodeDto>> GetListAsync();
        Task<List<TreeNodeDto>> GetListByParentIdAsync(Guid id);
        Task<TreeNodeDto> CreateAsync(CreateUpdateTreeNodeDto input);
        Task UpdateAsync(Guid id, CreateUpdateTreeNodeDto input);
        Task DeleteAsync(Guid id);
        Task RenameAsync(TreeNodeRenameInputDto input);
        Task<TreeNodeDto> CopyAsync(TreeNodeCopyInputDto input);
        Task MoveAsync(TreeNodeMoveInputDto input);
    }
}
