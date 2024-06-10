using JsTreeWithDotNetCoreAndCSharp.Domain;
using Microsoft.EntityFrameworkCore;

namespace JsTreeWithDotNetCoreAndCSharp.Infrastructure
{
    public class TreeDB : DbContext
    {
        public DbSet<TreeNode> Tree { get; set; }
        public TreeDB(DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.Entity<TreeNode>(b =>
            {
                b
                .HasMany<TreeNode>()
                .WithOne()
                .HasForeignKey(p => p.ParentId);
            });
        }
    }
}
