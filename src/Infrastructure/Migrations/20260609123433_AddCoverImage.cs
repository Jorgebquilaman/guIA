using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuIA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCoverImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cover_image_mime_type",
                table: "documents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cover_image_path",
                table: "documents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cover_image_mime_type",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "cover_image_path",
                table: "documents");
        }
    }
}
