namespace JsTreeWithDotNetCoreAndCSharp.Application.Dtos
{
    public class CreateUpdateTreeNodeDto
    {
        public string Name { get; set; }

        public Guid? ParentId { get; set; }
    }
}