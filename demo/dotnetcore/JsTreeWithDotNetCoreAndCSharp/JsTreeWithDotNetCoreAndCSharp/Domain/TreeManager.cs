using JsTreeWithDotNetCoreAndCSharp.Domain.Exceptions;
using JsTreeWithDotNetCoreAndCSharp.Infrastructure.Repositories;
using System.Diagnostics.CodeAnalysis;

namespace JsTreeWithDotNetCoreAndCSharp.Domain
{
    public class TreeManager
    {
        private readonly ITreeRepository _treeRepository;

        public TreeManager(ITreeRepository treeRepository)
        {
            _treeRepository = treeRepository;
        }
        public async Task<TreeNode> CreateAsync(
            [NotNull] string name,
            Guid? parentId)
        {
            bool alreadyExists = false;
            if (parentId.HasValue)
            {
                alreadyExists = await _treeRepository
                    .AnyAsync(
                        p => p.ParentId == parentId
                        && p.Name == name
                     );

            }
            else
            {
                alreadyExists = await _treeRepository
                    .AnyAsync(
                        p => p.ParentId == null
                        && p.Name == name
                     );
            }

            if (alreadyExists)
            {
                throw new TheNameIsAlreadyTakenException(name);
            }

            var TreeNode =
                new TreeNode(
                    Guid.NewGuid(),
                    name,
                    parentId
                );

            await _treeRepository.InsertAsync(TreeNode);
            await _treeRepository.SaveAsync();

            return TreeNode;
        }

        public async Task<TreeNode> UpdateAsync(
            TreeNode TreeNode,
            [NotNull] string name,
            Guid? parentId)
        {
            bool alreadyExists = false;
            if (parentId.HasValue)
            {
                alreadyExists = await _treeRepository
                    .AnyAsync(
                        p => p.ParentId == parentId
                        && p.Name == name
                     );
            }
            else
            {
                alreadyExists = await _treeRepository
                    .AnyAsync(
                        p => p.ParentId == null
                        && p.Name == name
                     );
            }

            if (alreadyExists)
            {
                throw new TheNameIsAlreadyTakenException(name);
            }

            TreeNode.ChangeName(name);

            if (TreeNode.ParentId != null)
            {
                TreeNode.ParentId = parentId;
            }

            await _treeRepository.UpdateAsync(TreeNode);
            await _treeRepository.SaveAsync();

            return TreeNode;
        }

        public async Task<TreeNode> RenameAsync(
            TreeNode TreeNode,
            [NotNull] string newName
            )
        {
            var alreadyExists = await _treeRepository
                    .AnyAsync(
                        p => p.ParentId == TreeNode.ParentId
                        && p.Name == newName
                     );

            if (alreadyExists)
            {
                throw new TheNameIsAlreadyTakenException(newName);
            }

            TreeNode.ChangeName(newName);

            await _treeRepository.UpdateAsync(TreeNode);
            await _treeRepository.SaveAsync();

            return TreeNode;
        }

        public async Task<TreeNode> MoveAsync(
                TreeNode TreeNode,
                Guid? newParentId
            )
        {
            if (TreeNode.ParentId == newParentId)
            {
                throw new TreeNodeAlreadyPresentAtThisLocationException(TreeNode.Name);
            }

            var alreadyExists = await _treeRepository
                    .AnyAsync(
                        p => p.ParentId == newParentId
                        && p.Name == TreeNode.Name
                     );

            if (alreadyExists)
            {
                throw new TheNameIsAlreadyTakenException(TreeNode.Name);
            }

            TreeNode.ParentId = newParentId;

            await _treeRepository.UpdateAsync(TreeNode);
            await _treeRepository.SaveAsync();
            return TreeNode;
        }

        public async Task DeleteAsync(
                Guid id
            )
        {
            if (
                await _treeRepository.AnyAsync(p => p.ParentId == id)
            )
            {
                throw new ThisTreeNodeHasChildrenException();
            }

            await _treeRepository.DeleteAsync(id);
            await _treeRepository.SaveAsync();
        }
    }
}
