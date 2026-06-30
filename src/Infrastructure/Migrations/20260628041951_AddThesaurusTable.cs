using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuIA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddThesaurusTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "thesaurus_terms",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    preferred_label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    language = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    alt_label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    definition = table.Column<string>(type: "text", nullable: true),
                    parent_thesaurus_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    effective_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    retirement_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_thesaurus_terms", x => x.id);
                    table.ForeignKey(
                        name: "fk_thesaurus_terms_parent",
                        column: x => x.parent_thesaurus_id,
                        principalTable: "thesaurus_terms",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_thesaurus_terms_alt_label",
                table: "thesaurus_terms",
                column: "alt_label");

            migrationBuilder.CreateIndex(
                name: "IX_thesaurus_terms_language",
                table: "thesaurus_terms",
                column: "language");

            migrationBuilder.CreateIndex(
                name: "IX_thesaurus_terms_parent_thesaurus_id",
                table: "thesaurus_terms",
                column: "parent_thesaurus_id");

            migrationBuilder.CreateIndex(
                name: "IX_thesaurus_terms_preferred_label",
                table: "thesaurus_terms",
                column: "preferred_label");

            migrationBuilder.CreateIndex(
                name: "IX_thesaurus_terms_type",
                table: "thesaurus_terms",
                column: "type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "thesaurus_terms");
        }
    }
}
