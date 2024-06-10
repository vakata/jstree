using JsTreeWithDotNetCoreAndCSharp.Domain;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace JsTreeWithDotNetCoreAndCSharp.Infrastructure.Repositories
{
    public class TreeRepository : ITreeRepository
    {
        private readonly TreeDB _treeDB;

        public TreeRepository(TreeDB treeDB)
        {
            _treeDB = treeDB;
        }

        public async Task<IEnumerable<TreeNode>> GetAllAsync()
        {
            return await _treeDB.Tree.ToListAsync();
        }

        public async Task<TreeNode?> GetAsync(Guid id)
        {
            return await _treeDB.Tree.FindAsync(id);
        }

        public async Task<TreeNode> InsertAsync(TreeNode entity)
        {
            await _treeDB.Tree.AddAsync(entity);
            return entity;
        }

        public async Task SaveAsync()
        {
            await _treeDB.SaveChangesAsync();
        }

        public async Task<TreeNode> UpdateAsync(TreeNode entity)
        {
            _treeDB.Entry(entity).State = EntityState.Modified;
            await Task.CompletedTask;
            return entity;
        }

        public async Task DeleteAsync(Guid id)
        {
            var treeNode = await _treeDB.Tree.FindAsync(id);
            _treeDB.Tree.Remove(treeNode);
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        private bool disposed = false;
        private async void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                    await _treeDB.DisposeAsync();
                }
            }
            this.disposed = true;
        }

        public async Task<bool> AnyAsync(Expression<Func<TreeNode, bool>> predicate)
        {
            return await _treeDB.Tree.AnyAsync(predicate);
        }

        public async Task<IEnumerable<TreeNode>> GetAllAsync(Expression<Func<TreeNode, bool>> predicate)
        {
            return await _treeDB.Tree.Where(predicate).ToListAsync();
        }

        public IQueryable<TreeNode> GetQueryable()
        {
            return _treeDB.Tree.AsQueryable();
        }
    }
}
