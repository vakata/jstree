using JsTreeWithDotNetCoreAndCSharp.Application.Dtos;
using JsTreeWithDotNetCoreAndCSharp.Domain;
using JsTreeWithDotNetCoreAndCSharp.Domain.Exceptions;
using JsTreeWithDotNetCoreAndCSharp.Infrastructure;
using JsTreeWithDotNetCoreAndCSharp.Infrastructure.Repositories;

namespace JsTreeWithDotNetCoreAndCSharp.Application
{
    public class TreeApplicationService : ITreeApplicationService
    {
        private readonly TreeManager _manager;
        private readonly ITreeRepository _repository;

        public TreeApplicationService(
            TreeManager manager, 
            ITreeRepository repository)
        {
            _manager = manager;
            _repository = repository;
        }

        public async Task<List<TreeNodeDto>> GetListAsync()
        {
            var q = _repository.GetQueryable();
            var query = from f in q.Where(p => p.ParentId == null)
                        select
                            new TreeNodeDto
                            {
                                Id = f.Id.ToString(),
                                Text = f.Name,
                                Children = (q.Where(p => p.ParentId == f.Id) != null),
                            };
            return query.ToList();
        }

        public async Task<List<TreeNodeDto>> GetListByParentIdAsync(Guid id)
        {
            var q = _repository.GetQueryable();
            var query = from f in q.Where(p => p.ParentId == id)
                        select
                            new TreeNodeDto
                            {
                                Id = f.Id.ToString(),
                                Text = f.Name,
                                Children = (q.Where(p => p.ParentId == f.Id) != null),
                            };
            return query.ToList();
        }

        public async Task<TreeNodeDto> CreateAsync(CreateUpdateTreeNodeDto input)
        {
            var treeNode = await _manager
                .CreateAsync(
                    input.Name,
                    input.ParentId
                );
            return new TreeNodeDto
            {
                Id = treeNode.Id.ToString(),
                Text = treeNode.Name,
                Children = true,
            };
        }

        public async Task UpdateAsync(Guid id, CreateUpdateTreeNodeDto input)
        {
            var treeNode = await _repository.GetAsync(id);
            await _manager
                .UpdateAsync(
                    treeNode,
                    input.Name,
                    input.ParentId
                );
        }

        public async Task DeleteAsync(Guid id)
        {
            await _manager.DeleteAsync(id);
        }

        public async Task RenameAsync(TreeNodeRenameInputDto input)
        {
            var treeNode = await _repository.GetAsync(input.Id);
            await _manager.RenameAsync(treeNode, input.NewName);
        }

        public async Task<TreeNodeDto> CopyAsync(TreeNodeCopyInputDto input)
        {
            var treeNode = await _repository.GetAsync(input.Id);
            if (treeNode == null)
            {
                throw new ThereIsntATreeNodeWithGivenIdException();
            }
            if (input.ParentId == treeNode.ParentId)
            {
                throw new TreeNodeAlreadyPresentAtThisLocationException(treeNode.Name);
            }
            var newTreeNode = await _manager.CreateAsync(
                    treeNode.Name,
                    input.ParentId
                );

            await CreateChildernAsync(treeNode.Id, newTreeNode.Id);

            return new TreeNodeDto
            {
                Id = newTreeNode.Id.ToString(),
                Text = newTreeNode.Name,
                Children = true,
            };
        }

        public async Task MoveAsync(TreeNodeMoveInputDto input)
        {
            var treeNode = await _repository.GetAsync(input.Id);
            await _manager.MoveAsync(treeNode, input.NewParentId);
        }

        private async Task CreateChildernAsync(Guid id, Guid parentId)
        {
            var oldTreeNodes = await _repository.GetAllAsync(p => p.ParentId == id);
            foreach (var folder in oldTreeNodes)
            {
                var newFolder = await _manager.CreateAsync(
                        folder.Name,
                        parentId
                    );
                await CreateChildernAsync(folder.Id, newFolder.Id);
            }
        }
    }
}
