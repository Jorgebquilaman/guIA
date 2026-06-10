using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuIA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDublinCoreFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // DocumentAuthor new columns
            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "document_authors",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "orcid",
                table: "document_authors",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "order",
                table: "document_authors",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Document Dublin Core columns
            migrationBuilder.AddColumn<string>(
                name: "advisor_name",
                table: "documents",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "institution",
                table: "documents",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "publication_date",
                table: "documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "abstract_es",
                table: "documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "license",
                table: "documents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "department",
                table: "documents",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "degree_program",
                table: "documents",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "email", table: "document_authors");
            migrationBuilder.DropColumn(name: "orcid", table: "document_authors");
            migrationBuilder.DropColumn(name: "order", table: "document_authors");
            migrationBuilder.DropColumn(name: "advisor_name", table: "documents");
            migrationBuilder.DropColumn(name: "institution", table: "documents");
            migrationBuilder.DropColumn(name: "publication_date", table: "documents");
            migrationBuilder.DropColumn(name: "abstract_es", table: "documents");
            migrationBuilder.DropColumn(name: "license", table: "documents");
            migrationBuilder.DropColumn(name: "department", table: "documents");
            migrationBuilder.DropColumn(name: "degree_program", table: "documents");
        }
    }
}
