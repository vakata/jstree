namespace JsTreeWithDotNetCoreAndCSharp.Application.Dtos
{
    public class TreeNodeMoveInputDto
    {
        public Guid Id { get; set; }
        public Guid NewParentId { get; set; }
    }
}