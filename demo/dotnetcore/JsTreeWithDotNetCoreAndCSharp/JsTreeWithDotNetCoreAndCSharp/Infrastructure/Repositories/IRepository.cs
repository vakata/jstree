using System.Linq.Expressions;

namespace JsTreeWithDotNetCoreAndCSharp.Infrastructure.Repositories
{
    public interface IRepository<T, Key> : IDisposable
    {
        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> GetAllAsync(Expression<Func<T, bool>> predicate);
        Task<T?> GetAsync(Key id);
        Task<T> InsertAsync(T entity);
        Task<T> UpdateAsync(T entity);
        Task DeleteAsync(Key id);
        Task SaveAsync();
        IQueryable<T> GetQueryable();
    }
}
