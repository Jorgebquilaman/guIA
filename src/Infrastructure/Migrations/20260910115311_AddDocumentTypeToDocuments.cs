using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuIA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentTypeToDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "document_type_def_id",
                table: "documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_documents_document_type_def_id",
                table: "documents",
                column: "document_type_def_id");

            migrationBuilder.AddForeignKey(
                name: "FK_documents_document_type_defs_document_type_def_id",
                table: "documents",
                column: "document_type_def_id",
                principalTable: "document_type_defs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_documents_document_type_defs_document_type_def_id",
                table: "documents");

            migrationBuilder.DropIndex(
                name: "IX_documents_document_type_def_id",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "document_type_def_id",
                table: "documents");
        }
    }
}
