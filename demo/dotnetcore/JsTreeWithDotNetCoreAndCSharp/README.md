# JsTreeWithDotNetCoreAndCSharp

This project is a backend implementation for jsTree, built using ASP.NET Core and C#. The user interface is developed with Razor Pages and APIs. The database used is SQL Server.

## Running the Project

To run the project, follow these steps:

1. Run the following command to apply the database migrations:

 - dotnet ef database update

2. Start the application by running the following command:
 - dotnet run

## Technologies Used

- ASP.NET Core
- C#
- Razor Pages
- SQL Server

## API Endpoints

The project exposes the following API endpoints:

- GET /api/Tree
- POST /api/Tree/create
- POST /api/Tree/copy
- POST /api/Tree/move
- PUT /api/Tree/rename
- DELETE /api/Tree/{id}

## Swagger API UI

The project includes Swagger for API documentation and testing. The API endpoints can be explored using the Swagger UI.

## Project Structure

The project follows a Domain-Driven Design (DDD) architecture, with the following structure:

- Application: Contains application services and use cases
- Domain: Contains domain entities, value objects, and domain services
- Infrastructure: Contains infrastructure-related implementations such as database context, repositories, and external service integrations

## Database Configuration

The database connection string can be configured in the appsettings.json file.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to contribute to this project.

## Support

For support, please contact [Your Name](mailto:nader.javid@gmail.com) at [nader.javid@gmail.com].

For support, please contact [Your Name](https://www.linkedin.com/in/nader-javid/) on LinkedIn.


