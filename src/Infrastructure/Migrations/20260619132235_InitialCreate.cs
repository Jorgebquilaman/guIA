using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuIA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "access_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    action = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    search_query = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    occurred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_access_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ai_metadata",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    summary = table.Column<string>(type: "text", nullable: true),
                    extracted_entities = table.Column<string>(type: "text", nullable: true),
                    generated_description = table.Column<string>(type: "text", nullable: true),
                    confidence = table.Column<double>(type: "double precision", nullable: true),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    model_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_metadata", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ai_provider_config",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    api_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    api_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    max_tokens = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    system_prompt = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_provider_config", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "collections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    ParentCollectionId = table.Column<Guid>(type: "uuid", nullable: true),
                    parent_collection_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_collections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_collections_collections_parent_collection_id",
                        column: x => x.parent_collection_id,
                        principalTable: "collections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "departments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#1B4D3E"),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_departments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "keywords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_keywords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "metadata_schemas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_type_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_metadata_schemas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "site_config",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    show_message = table.Column<bool>(type: "boolean", nullable: false),
                    message_text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    BaseUrl = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_config", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "smtp_config",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    host = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    port = table.Column<int>(type: "integer", nullable: false),
                    username = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    password = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    from_email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    from_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    use_ssl = table.Column<bool>(type: "boolean", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_smtp_config", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    full_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "degree_programs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    department_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_degree_programs", x => x.id);
                    table.ForeignKey(
                        name: "FK_degree_programs_departments_department_id",
                        column: x => x.department_id,
                        principalTable: "departments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "document_type_defs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    metadata_schema_id = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_type_defs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_document_type_defs_metadata_schemas_metadata_schema_id",
                        column: x => x.metadata_schema_id,
                        principalTable: "metadata_schemas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "metadata_fields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MetadataSchemaId = table.Column<Guid>(type: "uuid", nullable: false),
                    dublin_core_element = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    qualifier = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    internal_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    label = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    field_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    obligatoriness = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    is_repeatable = table.Column<bool>(type: "boolean", nullable: false),
                    is_read_only = table.Column<bool>(type: "boolean", nullable: false),
                    is_hidden = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    help_text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_metadata_fields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_metadata_fields_metadata_schemas_MetadataSchemaId",
                        column: x => x.MetadataSchemaId,
                        principalTable: "metadata_schemas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CollectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    uploaded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
                    ai_metadata_id = table.Column<Guid>(type: "uuid", nullable: true),
                    search_vector = table.Column<string>(type: "text", nullable: true),
                    cover_image_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    cover_image_mime_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    source_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    media_links = table.Column<string>(type: "jsonb", nullable: true),
                    advisor_name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    institution = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    publication_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    abstract_es = table.Column<string>(type: "text", nullable: true),
                    license = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    department = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    degree_program = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_documents_ai_metadata_ai_metadata_id",
                        column: x => x.ai_metadata_id,
                        principalTable: "ai_metadata",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_documents_collections_CollectionId",
                        column: x => x.CollectionId,
                        principalTable: "collections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_documents_users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    used = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_password_reset_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "metadata_field_options",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MetadataFieldId = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    label = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_metadata_field_options", x => x.Id);
                    table.ForeignKey(
                        name: "FK_metadata_field_options_metadata_fields_MetadataFieldId",
                        column: x => x.MetadataFieldId,
                        principalTable: "metadata_fields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "document_authors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    orcid = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_authors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_document_authors_documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "document_files",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    stored_path = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    original_file_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    mime_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    thumbnail_path = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_files", x => x.Id);
                    table.ForeignKey(
                        name: "FK_document_files_documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "document_keywords",
                columns: table => new
                {
                    DocumentsId = table.Column<Guid>(type: "uuid", nullable: false),
                    KeywordsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_keywords", x => new { x.DocumentsId, x.KeywordsId });
                    table.ForeignKey(
                        name: "FK_document_keywords_documents_DocumentsId",
                        column: x => x.DocumentsId,
                        principalTable: "documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_document_keywords_keywords_KeywordsId",
                        column: x => x.KeywordsId,
                        principalTable: "keywords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "document_metadata_values",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    MetadataFieldId = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<string>(type: "text", nullable: false),
                    repeat_index = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_metadata_values", x => x.Id);
                    table.ForeignKey(
                        name: "FK_document_metadata_values_documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_document_metadata_values_metadata_fields_MetadataFieldId",
                        column: x => x.MetadataFieldId,
                        principalTable: "metadata_fields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_collections_parent_collection_id",
                table: "collections",
                column: "parent_collection_id");

            migrationBuilder.CreateIndex(
                name: "IX_degree_programs_department_id",
                table: "degree_programs",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "IX_document_authors_DocumentId",
                table: "document_authors",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_document_files_DocumentId",
                table: "document_files",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_document_keywords_KeywordsId",
                table: "document_keywords",
                column: "KeywordsId");

            migrationBuilder.CreateIndex(
                name: "IX_document_metadata_values_DocumentId",
                table: "document_metadata_values",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_document_metadata_values_MetadataFieldId",
                table: "document_metadata_values",
                column: "MetadataFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_document_type_defs_metadata_schema_id",
                table: "document_type_defs",
                column: "metadata_schema_id");

            migrationBuilder.CreateIndex(
                name: "IX_documents_ai_metadata_id",
                table: "documents",
                column: "ai_metadata_id");

            migrationBuilder.CreateIndex(
                name: "IX_documents_CollectionId",
                table: "documents",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_documents_UploadedByUserId",
                table: "documents",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_keywords_value",
                table: "keywords",
                column: "value");

            migrationBuilder.CreateIndex(
                name: "IX_metadata_field_options_MetadataFieldId",
                table: "metadata_field_options",
                column: "MetadataFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_metadata_fields_MetadataSchemaId",
                table: "metadata_fields",
                column: "MetadataSchemaId");

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_user_id",
                table: "password_reset_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "access_logs");

            migrationBuilder.DropTable(
                name: "ai_provider_config");

            migrationBuilder.DropTable(
                name: "degree_programs");

            migrationBuilder.DropTable(
                name: "document_authors");

            migrationBuilder.DropTable(
                name: "document_files");

            migrationBuilder.DropTable(
                name: "document_keywords");

            migrationBuilder.DropTable(
                name: "document_metadata_values");

            migrationBuilder.DropTable(
                name: "document_type_defs");

            migrationBuilder.DropTable(
                name: "metadata_field_options");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "site_config");

            migrationBuilder.DropTable(
                name: "smtp_config");

            migrationBuilder.DropTable(
                name: "departments");

            migrationBuilder.DropTable(
                name: "keywords");

            migrationBuilder.DropTable(
                name: "documents");

            migrationBuilder.DropTable(
                name: "metadata_fields");

            migrationBuilder.DropTable(
                name: "ai_metadata");

            migrationBuilder.DropTable(
                name: "collections");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "metadata_schemas");
        }
    }
}
