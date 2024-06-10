using JsTreeWithDotNetCoreAndCSharp.Application;
using JsTreeWithDotNetCoreAndCSharp.Application.Dtos;
using JsTreeWithDotNetCoreAndCSharp.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;

namespace JsTreeWithDotNetCoreAndCSharp.Application.APIs
{
    [Route("api/[controller]")]
    [ApiController]
    public class TreeController : ControllerBase
    {
        private readonly ITreeApplicationService _treeNodeApp;

        public TreeController(ITreeApplicationService treeNodeApp)
        {
            _treeNodeApp = treeNodeApp;
        }

        [HttpGet]
        public async Task<List<TreeNodeDto>> GetTreesByIdAsync([FromQuery] Guid? id)
        {
            if (id.HasValue)
            {
                return await _treeNodeApp.GetListByParentIdAsync(id.Value);
            }
            var trees = await _treeNodeApp.GetListAsync();
            if (trees.Count == 0)
            {
                var root = await _treeNodeApp
                    .CreateAsync(new CreateUpdateTreeNodeDto
                    {
                        Name = "Root",
                        ParentId = null,
                    });
                trees
                    .Insert(0, new TreeNodeDto
                    {
                        Id = root.Id.ToString(),
                        Text = root.Text,
                        State = new TreeNodeStateDto { Opened = true, Selected = true, Disabled = false },
                        Children = true
                    });
            }
            return trees;
        }

        [HttpPost]
        [Route("create")]
        public async Task<TreeNodeDto> CreateAsync(CreateUpdateTreeNodeDto input)
        {
            return await _treeNodeApp.CreateAsync(input);
        }

        [HttpPost]
        [Route("copy")]
        public async Task CopyAsync(TreeNodeCopyInputDto input)
        {
            await _treeNodeApp.CopyAsync(input);
        }

        [HttpPost]
        [Route("move")]
        public async Task MoveAsync(TreeNodeMoveInputDto input)
        {
            await _treeNodeApp.MoveAsync(input);
        }

        [HttpPut]
        [Route("rename")]
        public async Task RenameAsync(TreeNodeRenameInputDto input)
        {
            await _treeNodeApp.RenameAsync(input);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task DeleteAsync(Guid id)
        {
            await _treeNodeApp.DeleteAsync(id);
        }
    }
}
