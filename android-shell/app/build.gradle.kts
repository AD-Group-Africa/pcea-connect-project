import java.util.Properties
import java.util.Base64

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Load the demo URL from gradle.properties (NOT committed; local override allowed).
// Resolve the file relative to this project's (or the root) directory.
val gradleProps = Properties().apply {
    val f = file("../gradle.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
// Local emulator testing only: set PCEA_SHELL_URL env var (e.g. http://10.0.2.2:3000) to
// build a loopback test APK. The shipped build always uses demoUrl from gradle.properties,
// defaulting to the production HTTPS domain.
val demoUrl: String = System.getenv("PCEA_SHELL_URL")
    ?: gradleProps.getProperty("demoUrl")
    ?: "https://pcea-connect.com"
val demoUrlB64: String = Base64.getEncoder().encodeToString(demoUrl.toByteArray(Charsets.UTF_8))

android {
    namespace = "ke.pcea.connect.shell"
    compileSdk = 35

    defaultConfig {
        applicationId = "ke.pcea.connect.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "0.1"

        // URL is passed via manifest placeholder, base64 so quotes/ampersands survive.
        resValue("string", "demo_url_b64", demoUrlB64)
        manifestPlaceholders["appLabel"] = "PCEA Connect"
    }

    signingConfigs {
        create("demo") {
            storeFile = file("../demo-release.keystore")
            storePassword = System.getenv("PCEA_DEMO_STORE_PASS") ?: "pcea-demo-2026"
            keyAlias = "pcea-demo"
            keyPassword = System.getenv("PCEA_DEMO_KEY_PASS") ?: "pcea-demo-2026"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("demo")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}
