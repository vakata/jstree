using System.Text.Json.Serialization;

namespace JsTreeWithDotNetCoreAndCSharp.Application.Dtos
{
    public class TreeNodeDto
    {
        public string Id { get; set; }
        public string Text { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string Icon { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Object Children { get; set; }
        public string Type { get; set; } = "root";
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public TreeNodeStateDto? State { get; set; }
    }
}
