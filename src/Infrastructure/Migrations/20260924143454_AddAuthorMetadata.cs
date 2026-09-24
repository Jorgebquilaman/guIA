using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuIA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthorMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AuthorizesPublication",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataConsentAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataConsentText",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "author_metadata_fields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    access_category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    internal_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    field_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    obligatoriness = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    is_repeatable = table.Column<bool>(type: "boolean", nullable: false),
                    is_hidden = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    help_text = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_author_metadata_fields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_author_metadata_fields_access_categories_access_category_id",
                        column: x => x.access_category_id,
                        principalTable: "access_categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "author_metadata_settings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    consent_text = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_author_metadata_settings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "author_metadata_field_options",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorMetadataFieldId = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    label = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_author_metadata_field_options", x => x.Id);
                    table.ForeignKey(
                        name: "FK_author_metadata_field_options_author_metadata_fields_Author~",
                        column: x => x.AuthorMetadataFieldId,
                        principalTable: "author_metadata_fields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_author_metadata_values",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_metadata_field_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<string>(type: "text", nullable: false),
                    repeat_index = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_author_metadata_values", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_author_metadata_values_author_metadata_fields_author_m~",
                        column: x => x.author_metadata_field_id,
                        principalTable: "author_metadata_fields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_author_metadata_values_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_author_metadata_field_options_AuthorMetadataFieldId",
                table: "author_metadata_field_options",
                column: "AuthorMetadataFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_author_metadata_fields_access_category_id",
                table: "author_metadata_fields",
                column: "access_category_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_author_metadata_values_author_metadata_field_id",
                table: "user_author_metadata_values",
                column: "author_metadata_field_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_author_metadata_values_user_id",
                table: "user_author_metadata_values",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "author_metadata_field_options");

            migrationBuilder.DropTable(
                name: "author_metadata_settings");

            migrationBuilder.DropTable(
                name: "user_author_metadata_values");

            migrationBuilder.DropTable(
                name: "author_metadata_fields");

            migrationBuilder.DropColumn(
                name: "AuthorizesPublication",
                table: "users");

            migrationBuilder.DropColumn(
                name: "DataConsentAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "DataConsentText",
                table: "users");
        }
    }
}
