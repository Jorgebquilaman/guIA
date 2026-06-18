using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuIA.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMetadataSchemaIdToDocTypeDef : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "metadata_schema_id",
                table: "document_type_defs",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_document_type_defs_metadata_schema_id",
                table: "document_type_defs",
                column: "metadata_schema_id");

            migrationBuilder.AddForeignKey(
                name: "FK_document_type_defs_metadata_schemas_metadata_schema_id",
                table: "document_type_defs",
                column: "metadata_schema_id",
                principalTable: "metadata_schemas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_document_type_defs_metadata_schemas_metadata_schema_id",
                table: "document_type_defs");

            migrationBuilder.DropIndex(
                name: "IX_document_type_defs_metadata_schema_id",
                table: "document_type_defs");

            migrationBuilder.DropColumn(
                name: "metadata_schema_id",
                table: "document_type_defs");
        }
    }
}
