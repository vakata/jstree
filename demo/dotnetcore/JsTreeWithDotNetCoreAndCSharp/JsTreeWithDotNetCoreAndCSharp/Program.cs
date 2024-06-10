using JsTreeWithDotNetCoreAndCSharp.Application;
using JsTreeWithDotNetCoreAndCSharp.Domain;
using JsTreeWithDotNetCoreAndCSharp.Infrastructure;
using JsTreeWithDotNetCoreAndCSharp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.VisualBasic;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddDbContext<TreeDB>(opt =>
{
    opt.UseSqlServer(
        config.GetConnectionString("TreeDbConnection")
        );
});
builder.Services.AddTransient<ITreeRepository, TreeRepository>();
builder.Services.AddTransient<ITreeApplicationService, TreeApplicationService>();
builder.Services.AddTransient<TreeManager>();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapRazorPages();

app.Run();
