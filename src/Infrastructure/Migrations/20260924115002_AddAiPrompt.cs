using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuIA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiPrompt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS \"FailedLoginAttempts\" integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS \"LockoutEnd\" timestamp with time zone;");

            migrationBuilder.AddColumn<string>(
                name: "ai_prompt",
                table: "metadata_fields",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailedLoginAttempts",
                table: "users");

            migrationBuilder.DropColumn(
                name: "LockoutEnd",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ai_prompt",
                table: "metadata_fields");
        }
    }
}
