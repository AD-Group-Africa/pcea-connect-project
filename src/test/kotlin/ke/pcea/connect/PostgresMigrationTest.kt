package ke.pcea.connect

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfSystemProperty
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import javax.sql.DataSource
import java.sql.DriverManager

/**
 * Verifies the COMPLETE Flyway migration chain (V015 through V048) executes cleanly
 * against a real PostgreSQL 16 instance.
 *
 * To run: set system property -Dpostgres.tests=true
 * Requires: Docker daemon running on the host.
 *
 * If this test passes, it means:
 * 1. Flyway created the complete schema from V015 through V048.
 * 2. Hibernate validated all entity mappings against the migrated schema.
 * 3. The Spring application context loads successfully against PostgreSQL.
 */
@Testcontainers
@EnabledIfSystemProperty(named = "postgres.tests", matches = "true")
@ActiveProfiles("postgres-test")
@SpringBootTest
class PostgresMigrationTest {

    @Autowired
    private lateinit var dataSource: DataSource

    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("pcea_test")
            .withUsername("test")
            .withPassword("test")

        @JvmStatic
        @DynamicPropertySource
        fun postgresProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url") { postgres.jdbcUrl }
            registry.add("spring.datasource.username") { postgres.username }
            registry.add("spring.datasource.password") { postgres.password }
        }
    }

    @Test
    fun `flyway migrations execute cleanly on fresh PostgreSQL`() {
        // If the Spring context started successfully (injected dataSource is non-null),
        // it means Flyway ran all migrations V015→V048 and Hibernate validate succeeded.
        check(dataSource.connection != null) { "DataSource should be available" }

        // Verify key tables exist from the new migrations
        dataSource.connection.use { conn ->
            conn.prepareStatement("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN (
                    'ministries', 'ministry_members', 'ministry_events', 'ministry_projects',
                    'ministry_announcements', 'sunday_school_classes', 'sunday_school_children',
                    'sunday_school_parent_links', 'sunday_school_lessons', 'sunday_school_attendance',
                    'sunday_school_progress', 'catechism_courses', 'catechism_modules',
                    'catechism_lessons', 'catechism_enrollments', 'catechism_progress', 'catechism_assessments'
                )
                ORDER BY table_name
            """.trimIndent()).use { stmt ->
                stmt.executeQuery().use { rs ->
                    val tables = mutableListOf<String>()
                    while (rs.next()) tables.add(rs.getString("table_name"))
                    check(tables.size >= 17) {
                        "Expected at least 17 key tables, got ${tables.size}: $tables"
                    }
                }
            }
        }
    }
}
